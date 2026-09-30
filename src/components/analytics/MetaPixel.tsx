const META_PIXEL_ID = '1018345797219731'
const PIXEL_SRC = 'https://connect.facebook.net/en_US/fbevents.js'

// Trade-off: the Pixel library (~200 KB and two long tasks) is not fetched
// until the visitor first interacts or 6 s have passed, whichever comes first.
// `init` and `PageView` are queued by the stub right away and flushed once the
// library arrives, so nothing is lost for visitors who stay or interact. A
// visitor who leaves within 6 s without interacting is not counted.
const PIXEL_BOOT_SCRIPT = `
(function(f,b,e,v,n){
  if(f.fbq)return;
  n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
  fbq('init','${META_PIXEL_ID}');
  fbq('track','PageView');
  var loaded=!1,timer,events=['pointerdown','keydown','scroll','touchstart','mousemove'],i;
  function load(){
    if(loaded)return;
    loaded=!0;
    clearTimeout(timer);
    for(i=0;i<events.length;i++)f.removeEventListener(events[i],load);
    var t=b.createElement(e),s=b.getElementsByTagName(e)[0];
    t.async=!0;t.src=v;s.parentNode.insertBefore(t,s);
  }
  for(i=0;i<events.length;i++)f.addEventListener(events[i],load,{passive:!0});
  timer=setTimeout(load,6000);
})(window,document,'script','${PIXEL_SRC}');
`

// Public marketing tree only (mounted from `[locale]/layout.tsx`).
export function MetaPixel(): React.JSX.Element {
  return (
    <>
      <script id="meta-pixel" dangerouslySetInnerHTML={{ __html: PIXEL_BOOT_SCRIPT }} />
      <noscript>
        {/* Exception to the next/image rule: a 1x1 tracking beacon inside <noscript> cannot use the image optimizer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
