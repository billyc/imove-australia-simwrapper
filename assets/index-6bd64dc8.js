import{b as v}from"./index-0a2cd937.js";var l={arraybuffer:"readAsArrayBuffer",dataurl:"readAsDataURL",text:"readAsText"};function f(a,e,r){var s;if(typeof e!="string"&&(r=e,e="arraybuffer"),!(a instanceof Blob)){var i=new Error("first argument is not a blob");if(r){r(i);return}else return Promise.reject(i)}r||(s=new Promise(function(t,o){r=function(u,m){u?o(u):t(m)}}));var d=l[e.toLowerCase()],n=new FileReader;return n.addEventListener("loadend",function t(o){n.removeEventListener("loadend",t),o.error?r(o.error):r(null,n.result)}),d?n[d](a):n.readAsText(a,e),s}var c=f;Object.keys(l).forEach(function(a){f[a]=function(e,r){return f(e,a,r)}});const A=v(c);export{A as r};
//# sourceMappingURL=index-6bd64dc8.js.map
