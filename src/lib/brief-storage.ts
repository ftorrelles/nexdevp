import { createServiceClient } from '@/lib/supabase'

const SIGNED_URL_TTL = 60 * 60 // 1 hour

export interface BriefAnswerRow {
  id: string
  brief_question_id: string
  value: string | null
  file_path: string | null
  answered_at: string
}

/**
 * Replaces file_path values with short-lived signed URLs from the
 * project-assets bucket. Mirrors the withSignedCvUrls pattern in supabase.ts.
 * Falls back to the stored path if signing fails.
 */
export async function withSignedBriefUrls(
  answers: BriefAnswerRow[]
): Promise<BriefAnswerRow[]> {
  const client = createServiceClient()
  const paths = answers.filter((a) => a.file_path).map((a) => a.file_path!)
  if (paths.length === 0) return answers

  const { data } = await client.storage
    .from('project-assets')
    .createSignedUrls(paths, SIGNED_URL_TTL)

  if (!data) return answers

  const signed = new Map(data.map((d) => [d.path, d.signedUrl]))

  return answers.map((a) => ({
    ...a,
    file_path:
      a.file_path && signed.get(a.file_path)
        ? signed.get(a.file_path)!
        : a.file_path,
  }))
}

/**
 * Uploads a file to the project-assets bucket under
 * {projectId}/{questionId}/{filename} and returns the storage path.
 * Uses the service client so no client-side RLS policy is required.
 */
export async function uploadBriefFile(
  projectId: string,
  questionId: string,
  file: File
): Promise<string> {
  const client = createServiceClient()
  const path = `${projectId}/${questionId}/${file.name}`

  const { error } = await client.storage
    .from('project-assets')
    .upload(path, file, { upsert: true })

  if (error) throw new Error(`Brief file upload failed: ${error.message}`)

  return path
}
