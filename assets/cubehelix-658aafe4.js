function _(e,n){return e==null||n==null?NaN:e<n?-1:e>n?1:e>=n?0:NaN}function ve(e,n){return e==null||n==null?NaN:n<e?-1:n>e?1:n>=e?0:NaN}function ae(e){let n,t,r;e.length!==2?(n=_,t=(f,c)=>_(e(f),c),r=(f,c)=>e(f)-c):(n=e===_||e===ve?e:Me,t=e,r=e);function i(f,c,h=0,l=f.length){if(h<l){if(n(c,c)!==0)return l;do{const o=h+l>>>1;t(f[o],c)<0?h=o+1:l=o}while(h<l)}return h}function a(f,c,h=0,l=f.length){if(h<l){if(n(c,c)!==0)return l;do{const o=h+l>>>1;t(f[o],c)<=0?h=o+1:l=o}while(h<l)}return h}function s(f,c,h=0,l=f.length){const o=i(f,c,h,l-1);return o>h&&r(f[o-1],c)>-r(f[o],c)?o-1:o}return{left:i,center:s,right:a}}function Me(){return 0}function He(e){return e===null?NaN:+e}function*Fe(e,n){if(n===void 0)for(let t of e)t!=null&&(t=+t)>=t&&(yield t);else{let t=-1;for(let r of e)(r=n(r,++t,e))!=null&&(r=+r)>=r&&(yield r)}}const fe=ae(_),Re=fe.right,Je=fe.left,Qe=ae(He).center,Te=Re;function R(e,n,t){e.prototype=n.prototype=t,t.constructor=e}function q(e,n){var t=Object.create(e.prototype);for(var r in n)t[r]=n[r];return t}function p(){}var N=.7,H=1/N,$="\\s*([+-]?\\d+)\\s*",k="\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",d="\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",ke=/^#([0-9a-f]{3,8})$/,Ce=new RegExp(`^rgb\\(${$},${$},${$}\\)$`),qe=new RegExp(`^rgb\\(${d},${d},${d}\\)$`),Ee=new RegExp(`^rgba\\(${$},${$},${$},${k}\\)$`),Pe=new RegExp(`^rgba\\(${d},${d},${d},${k}\\)$`),_e=new RegExp(`^hsl\\(${k},${d},${d}\\)$`),ze=new RegExp(`^hsla\\(${k},${d},${d},${k}\\)$`),J={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074};R(p,K,{copy(e){return Object.assign(new this.constructor,this,e)},displayable(){return this.rgb().displayable()},hex:Q,formatHex:Q,formatHex8:Be,formatHsl:Ae,formatRgb:T,toString:T});function Q(){return this.rgb().formatHex()}function Be(){return this.rgb().formatHex8()}function Ae(){return se(this).formatHsl()}function T(){return this.rgb().formatRgb()}function K(e){var n,t;return e=(e+"").trim().toLowerCase(),(n=ke.exec(e))?(t=n[1].length,n=parseInt(n[1],16),t===6?U(n):t===3?new u(n>>8&15|n>>4&240,n>>4&15|n&240,(n&15)<<4|n&15,1):t===8?E(n>>24&255,n>>16&255,n>>8&255,(n&255)/255):t===4?E(n>>12&15|n>>8&240,n>>8&15|n>>4&240,n>>4&15|n&240,((n&15)<<4|n&15)/255):null):(n=Ce.exec(e))?new u(n[1],n[2],n[3],1):(n=qe.exec(e))?new u(n[1]*255/100,n[2]*255/100,n[3]*255/100,1):(n=Ee.exec(e))?E(n[1],n[2],n[3],n[4]):(n=Pe.exec(e))?E(n[1]*255/100,n[2]*255/100,n[3]*255/100,n[4]):(n=_e.exec(e))?ee(n[1],n[2]/100,n[3]/100,1):(n=ze.exec(e))?ee(n[1],n[2]/100,n[3]/100,n[4]):J.hasOwnProperty(e)?U(J[e]):e==="transparent"?new u(NaN,NaN,NaN,0):null}function U(e){return new u(e>>16&255,e>>8&255,e&255,1)}function E(e,n,t,r){return r<=0&&(e=n=t=NaN),new u(e,n,t,r)}function X(e){return e instanceof p||(e=K(e)),e?(e=e.rgb(),new u(e.r,e.g,e.b,e.opacity)):new u}function z(e,n,t,r){return arguments.length===1?X(e):new u(e,n,t,r??1)}function u(e,n,t,r){this.r=+e,this.g=+n,this.b=+t,this.opacity=+r}R(u,z,q(p,{brighter(e){return e=e==null?H:Math.pow(H,e),new u(this.r*e,this.g*e,this.b*e,this.opacity)},darker(e){return e=e==null?N:Math.pow(N,e),new u(this.r*e,this.g*e,this.b*e,this.opacity)},rgb(){return this},clamp(){return new u(m(this.r),m(this.g),m(this.b),B(this.opacity))},displayable(){return-.5<=this.r&&this.r<255.5&&-.5<=this.g&&this.g<255.5&&-.5<=this.b&&this.b<255.5&&0<=this.opacity&&this.opacity<=1},hex:V,formatHex:V,formatHex8:Ie,formatRgb:W,toString:W}));function V(){return`#${w(this.r)}${w(this.g)}${w(this.b)}`}function Ie(){return`#${w(this.r)}${w(this.g)}${w(this.b)}${w((isNaN(this.opacity)?1:this.opacity)*255)}`}function W(){const e=B(this.opacity);return`${e===1?"rgb(":"rgba("}${m(this.r)}, ${m(this.g)}, ${m(this.b)}${e===1?")":`, ${e})`}`}function B(e){return isNaN(e)?1:Math.max(0,Math.min(1,e))}function m(e){return Math.max(0,Math.min(255,Math.round(e)||0))}function w(e){return e=m(e),(e<16?"0":"")+e.toString(16)}function ee(e,n,t,r){return r<=0?e=n=t=NaN:t<=0||t>=1?e=n=NaN:n<=0&&(e=NaN),new x(e,n,t,r)}function se(e){if(e instanceof x)return new x(e.h,e.s,e.l,e.opacity);if(e instanceof p||(e=K(e)),!e)return new x;if(e instanceof x)return e;e=e.rgb();var n=e.r/255,t=e.g/255,r=e.b/255,i=Math.min(n,t,r),a=Math.max(n,t,r),s=NaN,f=a-i,c=(a+i)/2;return f?(n===a?s=(t-r)/f+(t<r)*6:t===a?s=(r-n)/f+2:s=(n-t)/f+4,f/=c<.5?a+i:2-a-i,s*=60):f=c>0&&c<1?0:s,new x(s,f,c,e.opacity)}function je(e,n,t,r){return arguments.length===1?se(e):new x(e,n,t,r??1)}function x(e,n,t,r){this.h=+e,this.s=+n,this.l=+t,this.opacity=+r}R(x,je,q(p,{brighter(e){return e=e==null?H:Math.pow(H,e),new x(this.h,this.s,this.l*e,this.opacity)},darker(e){return e=e==null?N:Math.pow(N,e),new x(this.h,this.s,this.l*e,this.opacity)},rgb(){var e=this.h%360+(this.h<0)*360,n=isNaN(e)||isNaN(this.s)?0:this.s,t=this.l,r=t+(t<.5?t:1-t)*n,i=2*t-r;return new u(j(e>=240?e-240:e+120,i,r),j(e,i,r),j(e<120?e+240:e-120,i,r),this.opacity)},clamp(){return new x(ne(this.h),P(this.s),P(this.l),B(this.opacity))},displayable(){return(0<=this.s&&this.s<=1||isNaN(this.s))&&0<=this.l&&this.l<=1&&0<=this.opacity&&this.opacity<=1},formatHsl(){const e=B(this.opacity);return`${e===1?"hsl(":"hsla("}${ne(this.h)}, ${P(this.s)*100}%, ${P(this.l)*100}%${e===1?")":`, ${e})`}`}}));function ne(e){return e=(e||0)%360,e<0?e+360:e}function P(e){return Math.max(0,Math.min(1,e||0))}function j(e,n,t){return(e<60?n+(t-n)*e/60:e<180?t:e<240?n+(t-n)*(240-e)/60:n)*255}const ce=Math.PI/180,le=180/Math.PI,A=18,he=.96422,ue=1,oe=.82521,xe=4/29,v=6/29,ge=3*v*v,Le=v*v*v;function be(e){if(e instanceof g)return new g(e.l,e.a,e.b,e.opacity);if(e instanceof b)return pe(e);e instanceof u||(e=X(e));var n=O(e.r),t=O(e.g),r=O(e.b),i=L((.2225045*n+.7168786*t+.0606169*r)/ue),a,s;return n===t&&t===r?a=s=i:(a=L((.4360747*n+.3850649*t+.1430804*r)/he),s=L((.0139322*n+.0971045*t+.7141733*r)/oe)),new g(116*i-16,500*(a-i),200*(i-s),e.opacity)}function Ue(e,n){return new g(e,0,0,n??1)}function Se(e,n,t,r){return arguments.length===1?be(e):new g(e,n,t,r??1)}function g(e,n,t,r){this.l=+e,this.a=+n,this.b=+t,this.opacity=+r}R(g,Se,q(p,{brighter(e){return new g(this.l+A*(e??1),this.a,this.b,this.opacity)},darker(e){return new g(this.l-A*(e??1),this.a,this.b,this.opacity)},rgb(){var e=(this.l+16)/116,n=isNaN(this.a)?e:e+this.a/500,t=isNaN(this.b)?e:e-this.b/200;return n=he*S(n),e=ue*S(e),t=oe*S(t),new u(D(3.1338561*n-1.6168667*e-.4906146*t),D(-.9787684*n+1.9161415*e+.033454*t),D(.0719453*n-.2289914*e+1.4052427*t),this.opacity)}}));function L(e){return e>Le?Math.pow(e,1/3):e/ge+xe}function S(e){return e>v?e*e*e:ge*(e-xe)}function D(e){return 255*(e<=.0031308?12.92*e:1.055*Math.pow(e,1/2.4)-.055)}function O(e){return(e/=255)<=.04045?e/12.92:Math.pow((e+.055)/1.055,2.4)}function de(e){if(e instanceof b)return new b(e.h,e.c,e.l,e.opacity);if(e instanceof g||(e=be(e)),e.a===0&&e.b===0)return new b(NaN,0<e.l&&e.l<100?0:NaN,e.l,e.opacity);var n=Math.atan2(e.b,e.a)*le;return new b(n<0?n+360:n,Math.sqrt(e.a*e.a+e.b*e.b),e.l,e.opacity)}function Ve(e,n,t,r){return arguments.length===1?de(e):new b(t,n,e,r??1)}function De(e,n,t,r){return arguments.length===1?de(e):new b(e,n,t,r??1)}function b(e,n,t,r){this.h=+e,this.c=+n,this.l=+t,this.opacity=+r}function pe(e){if(isNaN(e.h))return new g(e.l,0,0,e.opacity);var n=e.h*ce;return new g(e.l,Math.cos(n)*e.c,Math.sin(n)*e.c,e.opacity)}R(b,De,q(p,{brighter(e){return new b(this.h,this.c,this.l+A*(e??1),this.opacity)},darker(e){return new b(this.h,this.c,this.l-A*(e??1),this.opacity)},rgb(){return pe(this).rgb()}}));var we=-.14861,Y=1.78277,Z=-.29227,I=-.90649,C=1.97294,te=C*I,re=C*Y,ie=Y*Z-I*we;function Oe(e){if(e instanceof y)return new y(e.h,e.s,e.l,e.opacity);e instanceof u||(e=X(e));var n=e.r/255,t=e.g/255,r=e.b/255,i=(ie*r+te*n-re*t)/(ie+te-re),a=r-i,s=(C*(t-i)-Z*a)/I,f=Math.sqrt(s*s+a*a)/(C*i*(1-i)),c=f?Math.atan2(s,a)*le-120:NaN;return new y(c<0?c+360:c,f,i,e.opacity)}function G(e,n,t,r){return arguments.length===1?Oe(e):new y(e,n,t,r??1)}function y(e,n,t,r){this.h=+e,this.s=+n,this.l=+t,this.opacity=+r}R(y,G,q(p,{brighter(e){return e=e==null?H:Math.pow(H,e),new y(this.h,this.s,this.l*e,this.opacity)},darker(e){return e=e==null?N:Math.pow(N,e),new y(this.h,this.s,this.l*e,this.opacity)},rgb(){var e=isNaN(this.h)?0:(this.h+120)*ce,n=+this.l,t=isNaN(this.s)?0:this.s*n*(1-n),r=Math.cos(e),i=Math.sin(e);return new u(255*(n+t*(we*r+Y*i)),255*(n+t*(Z*r+I*i)),255*(n+t*(C*r)),this.opacity)}}));function me(e,n,t,r,i){var a=e*e,s=a*e;return((1-3*e+3*a-s)*n+(4-6*a+3*s)*t+(1+3*e+3*a-3*s)*r+s*i)/6}function Ge(e){var n=e.length-1;return function(t){var r=t<=0?t=0:t>=1?(t=1,n-1):Math.floor(t*n),i=e[r],a=e[r+1],s=r>0?e[r-1]:2*i-a,f=r<n-1?e[r+2]:2*a-i;return me((t-r/n)*n,s,i,a,f)}}function Ke(e){var n=e.length;return function(t){var r=Math.floor(((t%=1)<0?++t:t)*n),i=e[(r+n-1)%n],a=e[r%n],s=e[(r+1)%n],f=e[(r+2)%n];return me((t-r/n)*n,i,a,s,f)}}const F=e=>()=>e;function ye(e,n){return function(t){return e+t*n}}function Xe(e,n,t){return e=Math.pow(e,t),n=Math.pow(n,t)-e,t=1/t,function(r){return Math.pow(e+r*n,t)}}function Ye(e,n){var t=n-e;return t?ye(e,t>180||t<-180?t-360*Math.round(t/360):t):F(isNaN(e)?n:e)}function Ze(e){return(e=+e)==1?M:function(n,t){return t-n?Xe(n,t,e):F(isNaN(n)?t:n)}}function M(e,n){var t=n-e;return t?ye(e,t):F(isNaN(e)?n:e)}const We=function e(n){var t=Ze(n);function r(i,a){var s=t((i=z(i)).r,(a=z(a)).r),f=t(i.g,a.g),c=t(i.b,a.b),h=M(i.opacity,a.opacity);return function(l){return i.r=s(l),i.g=f(l),i.b=c(l),i.opacity=h(l),i+""}}return r.gamma=e,r}(1);function Ne(e){return function(n){var t=n.length,r=new Array(t),i=new Array(t),a=new Array(t),s,f;for(s=0;s<t;++s)f=z(n[s]),r[s]=f.r||0,i[s]=f.g||0,a[s]=f.b||0;return r=e(r),i=e(i),a=e(a),f.opacity=1,function(c){return f.r=r(c),f.g=i(c),f.b=a(c),f+""}}}var en=Ne(Ge),nn=Ne(Ke);function $e(e){return function n(t){t=+t;function r(i,a){var s=e((i=G(i)).h,(a=G(a)).h),f=M(i.s,a.s),c=M(i.l,a.l),h=M(i.opacity,a.opacity);return function(l){return i.h=s(l),i.s=f(l),i.l=c(Math.pow(l,t)),i.opacity=h(l),i+""}}return r.gamma=n,r}(1)}const tn=$e(Ye);var rn=$e(M);export{Qe as A,G as a,Te as b,K as c,je as d,Ve as e,en as f,Ue as g,De as h,rn as i,Ge as j,_ as k,Se as l,Je as m,ve as n,F as o,We as p,ae as q,z as r,Re as s,Fe as t,He as u,Ye as v,M as w,Ke as x,tn as y,nn as z};
//# sourceMappingURL=cubehelix-658aafe4.js.map
