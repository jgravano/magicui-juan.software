import type { Metadata } from "next";
import localFont from "next/font/local";
import { Syne, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import "./globals.css";

// Importación del componente de cursor personalizado con carga dinámica del lado del cliente
const CursorEffect = dynamic(() => import('@/components/cursor-effect'), { 
  ssr: false,
  loading: () => null 
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Juan Gravano — QA Engineer & Creative Technologist",
  description: "Explorando la intersección entre tecnología y creatividad. QA Engineer y Creative Technologist basado en Buenos Aires, especializado en automatización y proyectos creativos.",
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      }
    ],
  },
  keywords: [
    "Juan Gravano",
    "QA Engineer",
    "Creative Technologist",
    "Buenos Aires",
    "Quality Engineering",
    "Creative Technology",
    "Test Automation",
    "Digital Art",
    "Software Engineering",
    "Innovación",
    "Tecnología Creativa",
    "Diseño Interactivo"
  ],
  authors: [{ name: "Juan Gravano" }],
  creator: "Juan Gravano",
  publisher: "Juan Gravano",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://juan.software",
    title: "Juan Gravano — QA Engineer & Creative Technologist",
    description: "Explorando la intersección entre tecnología y creatividad. QA Engineer y Creative Technologist basado en Buenos Aires.",
    siteName: "Juan Gravano",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Juan Gravano - Portfolio'
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Juan Gravano — QA Engineer & Creative Technologist",
    description: "Explorando la intersección entre tecnología y creatividad. QA Engineer y Creative Technologist basado en Buenos Aires.",
    images: ['/og-image.jpg']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="retro-bg">
      <body
        className={`${syne.variable} ${geistMono.variable} ${spaceGrotesk.variable} font-sans antialiased bg-zinc-950`}
      >
        {/* Cursor personalizado - solo se renderiza en el cliente */}
        <CursorEffect />
        
        {/* Contenido principal */}
        <main className="relative">
          {children}
        </main>
        
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>

        {/* Plausible Analytics (Privacy-focused alternative) */}
        <Script 
          data-domain="juan.software" 
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
        
        {/* Lenis Smooth Scroll Effect */}
        <Script id="lenis-scroll" strategy="afterInteractive">
          {`
            !function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).Lenis={})}(this,function(e){"use strict";function t(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e,t){for(var i=0;i<t.length;i++){var n=t[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}function n(e,t,n){return t&&i(e.prototype,t),n&&i(e,n),Object.defineProperty(e,"prototype",{writable:!1}),e}function s(){return s=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var i=arguments[t];for(var n in i)Object.prototype.hasOwnProperty.call(i,n)&&(e[n]=i[n])}return e},s.apply(this,arguments)}function o(e,t){return o=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},o(e,t)}function r(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&o(e,t)}function l(e){return l=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(e){return e.__proto__||Object.getPrototypeOf(e)},l(e)}function c(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch(e){return!1}}function h(e,t,i){return h=c()?Reflect.construct.bind():function(e,t,i){var n=[null];n.push.apply(n,t);var s=new(Function.bind.apply(e,n));return i&&o(s,i.prototype),s},h.apply(null,arguments)}function a(e){var t="function"==typeof Map?new Map:void 0;return a=function(e){if(null===e||(i=e,-1===Function.toString.call(i).indexOf("[native code]")))return e;var i;if("function"!=typeof e)throw new TypeError("Super expression must either be null or a function");if(void 0!==t){if(t.has(e))return t.get(e);t.set(e,n)}function n(){return h(e,arguments,l(this).constructor)}return n.prototype=Object.create(e.prototype,{constructor:{value:n,enumerable:!1,writable:!0,configurable:!0}}),o(n,e)},a(e)}function u(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function f(e){var t=c();return function(){var i,n=l(e);if(t){var s=l(this).constructor;i=Reflect.construct(n,arguments,s)}else i=n.apply(this,arguments);return function(e,t){if(t&&("object"==typeof t||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return u(e)}(this,i)}}function p(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&o(e,t)}function d(e){return-1!==navigator.userAgent.toLowerCase().indexOf(e)}var v=function(){function e(){t(this,e),this.events={}}return n(e,[{key:"emit",value:function(e){for(var t=this.events[e]||[],i=t.length>0,n=0,s=t.slice(0);n<s.length;n++){(0,s[n])(e)}return i}},{key:"on",value:function(e,t){var i=this;return this.events[e]||(this.events[e]=[]),this.events[e].push(t),function(){i.events[e]=i.events[e].filter(function(e){return t!==e})}}},{key:"destroy",value:function(){this.events={}}}]),e}(),y=function(){function e(){var i=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};t(this,e),this.options=Object.assign({},{wrapper:window,content:document.documentElement,wheelEventsTarget:document,eventsTarget:document,smoothWheel:!0,smoothTouch:!1,syncTouch:!1,syncTouchLerp:.1,touchInertiaMultiplier:35,duration:1.2,easing:function(e){return Math.min(1,1.001-Math.pow(2,-10*e))},lerp:.09,infinite:!1,orientation:"vertical",gestureOrientation:"vertical",touchMultiplier:1,wheelMultiplier:1,normalizeWheel:!1,autoResize:!0},i),this.dimensions=this.getDimensions(),this.orientation=this.options.orientation.toLowerCase(),this.isVertical="vertical"===this.orientation,this.gesture={orientation:this.options.gestureOrientation.toLowerCase()},this.gesture.isVertical="vertical"===this.gesture.orientation,this.events=new v,this.animate={target:0,current:0,currentScrollBar:0,time:0,stopped:!0},this.scrollBar={onPush:null,onRelease:null},this.wrapperNode=this.options.wrapper,this.push=0,this.contentNode=this.options.content,this.onResizeCallback=this.resize.bind(this),this.options.autoResize&&window.addEventListener("resize",this.onResizeCallback),this.vieportSizeName=this.isVertical?"height":"width",this.scrollPosSizeName=this.isVertical?"top":"left",this.scrollSizeName=this.isVertical?"scrollHeight":"scrollWidth",this.axisSizeName=this.isVertical?"height":"width",this.axisDirName=this.isVertical?"y":"x",this.on("scroll",function(e){console.log(e)}),this.onVirtualScrollCallback=this.onVirtualScroll.bind(this),this.onTouchStartCallback=this.onTouchStart.bind(this),this.onTouchMoveCallback=this.onTouchMove.bind(this),this.onTouchEndCallback=this.onTouchEnd.bind(this),this.options.eventsTarget.addEventListener("wheel",this.onVirtualScrollCallback),this.options.smoothTouch&&(this.options.eventsTarget.addEventListener("touchstart",this.onTouchStartCallback,{passive:!1}),this.options.eventsTarget.addEventListener("touchmove",this.onTouchMoveCallback,{passive:!1}),this.options.eventsTarget.addEventListener("touchend",this.onTouchEndCallback,{passive:!1})),this.options.infinite||(this.clampTarget=this.clampTarget.bind(this))}return n(e,[{key:"start",value:function(){var e=this;return this.animate.stopped&&(this.animate.stopped=!1,this.animate.time=window.performance.now(),this.ticker=requestAnimationFrame(function(){return e.raf()})),this}},{key:"stop",value:function(){return this.animate.stopped||(this.animate.stopped=!0,cancelAnimationFrame(this.ticker),this.ticker=null,this.resetScroll()),this}},{key:"onVirtualScroll",value:function(e){var t=this;if(!this.options.smoothWheel)return null;e.preventDefault();var i=0,n=0,s=0;this.options.normalizeWheel?(n=e.deltaY,s=this.options.wheelMultiplier):function(){if(e.deltaUnit===WheelEvent.DOM_DELTA_PIXEL)i=1;else if(e.deltaUnit===WheelEvent.DOM_DELTA_LINE)i=5;else if(d("firefox"))i=100;else{i=e.deltaMode===WheelEvent.DOM_DELTA_PIXEL?1:100}e.deltaY&&(n=(e.deltaY?e.deltaY*i:0)*1),e.deltaX&&(n=e.deltaX?e.deltaX*i:0)}(),n*=this.options.wheelMultiplier;var o=n,r=n;this.gesture.isVertical&&!this.isVertical?o=0:!this.gesture.isVertical&&this.isVertical&&(r=0),this.add(this.isVertical?r:o),clearTimeout(this.wheelStopTimeout),this.wheelStopTimeout=setTimeout(function(){t.events.emit("scroll-end")},100),this.events.emit("scroll-start")}},{key:"onTouchStart",value:function(e){if(!this.options.smoothTouch)return null;this.isTouching=!0,this.touchStart=g(e),this.lastDelta={x:0,y:0},this.events.emit("scroll-start")}},{key:"onTouchMove",value:function(e){if(!this.options.smoothTouch||!this.isTouching||void 0===this.touchStart)return null;e.preventDefault(),e.stopPropagation();var t=g(e),i={x:-(t.x-this.touchStart.x),y:-(t.y-this.touchStart.y)};this.options.syncTouch?(this.lastDelta=i,this.forceTo(i[this.axisDirName]*this.options.touchMultiplier)):this.add(this.gesture.isVertical?i.y-this.lastDelta.y:i.x-this.lastDelta.x),this.lastDelta=i}},{key:"onTouchEnd",value:function(e){var t=this;if(!this.options.smoothTouch||!this.isTouching)return null;this.isTouching=!1;var i=this.lastDelta[this.axisDirName],n={x:0,y:0};n[this.axisDirName]=Math.pow(i,2)/this.options.touchMultiplier*this.options.touchInertiaMultiplier,this.options.syncTouch&&this.scroll({targetScroll:this.animate.target+n[this.axisDirName],time:0,easing:this.options.easing}),clearTimeout(this.touchStopTimeout),this.touchStopTimeout=setTimeout(function(){t.events.emit("scroll-end")},100)}},{key:"reset",value:function(){this.animate.target=0,this.animate.current=0,this.scrollTo(0,{immediate:!0})}},{key:"forceTo",value:function(e){this.isScrolling=!0,this.options.syncTouch&&(this.animate.target=e,this.animate.current=e*this.options.syncTouchLerp)}},{key:"add",value:function(e){this.isScrolling=!0,this.animate.target+=e}},{key:"resetScroll",value:function(){this.isScrolling=!1}},{key:"clampTarget",value:function(){this.options.infinite||(this.animate.target=Math.max(0,Math.min(this.limit,this.animate.target)),0!==this.animate.target&&this.animate.target!==this.limit||(this.isScrolling=!1))}},{key:"scrollTo",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};(e="string"==typeof e?e:parseFloat(e))instanceof HTMLElement&&(e=this.isVertical?e.offsetTop:e.offsetLeft);var i=t.offset||0;this.animate.target=e+i,t.immediate&&(this.animate.current=this.animate.target)}},{key:"scroll",value:function(e){var t=this,i=e.targetScroll,n=e.time,s=e.easing;this.animate.target=i,this.animate.time=n,this.animate.easing=s,requestAnimationFrame(function(){t.setScroll(i)})}},{key:"setScroll",value:function(e){this.isScrolling=!0,0!==this.limit||(e=0),this.isVertical?this.wrapperNode.scrollTo(0,e):this.wrapperNode.scrollTo(e,0)}},{key:"update",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};s(this.options,e)}},{key:"getDimensions",value:function(){var e=this.options.wrapper===window?window.document.documentElement:this.options.wrapper;return{wrapper:{width:this.options.wrapper.innerWidth?this.options.wrapper.innerWidth:e.clientWidth,height:this.options.wrapper.innerHeight?this.options.wrapper.innerHeight:e.clientHeight},content:{width:this.options.content.clientWidth-parseInt(window.getComputedStyle(this.options.content).paddingRight)-parseInt(window.getComputedStyle(this.options.content).paddingLeft),height:this.options.content.clientHeight-parseInt(window.getComputedStyle(this.options.content).paddingTop)-parseInt(window.getComputedStyle(this.options.content).paddingBottom)}}}},{key:"resize",value:function(){this.dimensions=this.getDimensions()}},{key:"dispose",value:function(){this.options.eventsTarget.removeEventListener("wheel",this.onVirtualScrollCallback),this.options.eventsTarget.removeEventListener("touchstart",this.onTouchStartCallback,{passive:!1}),this.options.eventsTarget.removeEventListener("touchmove",this.onTouchMoveCallback,{passive:!1}),this.options.eventsTarget.removeEventListener("touchend",this.onTouchEndCallback,{passive:!1}),this.options.autoResize&&window.removeEventListener("resize",this.onResizeCallback)}},{key:"on",value:function(e,t){return this.events.on(e,t)}},{key:"raf",value:function(){var e=this;this.raf=requestAnimationFrame(function(){return e.raf()});var t=this.options.easing,i=window.performance.now(),n=Math.min(1,(i-this.animate.time)/this.options.duration);this.options.infinite||(this.animate.target=Math.max(0,Math.min(this.limit,this.animate.target))),(this.animate.current!==this.animate.target||this.isScrolling)&&(this.isScrolling||(this.events.emit("scroll"),this.isScrolling=!0),n<1?(this.animate.current=this.animate.current+(this.animate.target-this.animate.current)*t(n)):n>=1&&(this.animate.current=this.animate.target)),this.options.infinite||(0===this.animate.current?this.events.emit("scroll-start"):this.animate.current===this.limit&&this.events.emit("scroll-end")),this.isVertical?this.contentNode.style.transform="translate3d(0, ".concat(-this.animate.current,"px, 0)"):this.contentNode.style.transform="translate3d(".concat(-this.animate.current,"px, 0, 0)")}},{key:"limit",get:function(){return this.isVertical?Math.max(0,this.contentNode.scrollHeight-this.dimensions.wrapper.height):Math.max(0,this.contentNode.scrollWidth-this.dimensions.wrapper.width)}}]),e}();function g(e){var t={x:0,y:0};if(e.targetTouches){var i=e.targetTouches[0];t.x=i.clientX,t.y=i.clientY}else t.x=e.clientX,t.y=e.clientY;return t}e.default=y,Object.defineProperty(e,"__esModule",{value:!0})});

            document.addEventListener("DOMContentLoaded", () => {
              const lenis = new Lenis({
                duration: 1,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: 'vertical',
                gestureOrientation: 'vertical',
                smoothWheel: true,
                wheelMultiplier: 1,
                smoothTouch: false,
                touchMultiplier: 2,
                infinite: false,
              });
              
              function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
              }
              
              requestAnimationFrame(raf);
              
              // Añadir clase para manejar el scroll suave
              document.documentElement.classList.add('lenis-smooth');
            });
          `}
        </Script>
        
        {/* Script para animaciones de cursor */}
        <Script id="cursor-animation" strategy="afterInteractive">
          {`
            document.addEventListener("DOMContentLoaded", () => {
              const cursor = document.getElementById('cursor-effect');
              if (!cursor) return;
              
              // Asegurarse de que el cursor esté oculto al principio
              cursor.style.opacity = '0';
              
              // Mostrar el cursor después de un breve retraso
              setTimeout(() => {
                cursor.style.opacity = '1';
                cursor.style.transition = 'opacity 0.5s ease, transform 0.2s ease, background-color 0.3s ease';
              }, 500);
            });
          `}
        </Script>
      </body>
    </html>
  );
}
