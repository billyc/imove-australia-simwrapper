import{d as c,g as i,n as m}from"./index-0a2cd937.js";const n=[{pixels:1e4,factor:.01,length:10,label:"m"},{pixels:5e3,factor:.02,length:20,label:"m"},{pixels:2e3,factor:.05,length:50,label:"m"},{pixels:1e3,factor:.1,length:100,label:"m"},{pixels:500,factor:.2,length:200,label:"m"},{pixels:250,factor:.5,length:500,label:"m"},{pixels:100,factor:1,length:1,label:"km"},{pixels:50,factor:2,length:2,label:"km"},{pixels:20,factor:5,length:5,label:"km"},{pixels:8,factor:10,length:10,label:"km"},{pixels:4,factor:20,length:20,label:"km"},{pixels:2,factor:50,length:50,label:"km"},{pixels:1,factor:100,length:100,label:"km"}],r=[{pixels:2e4,factor:.003787878,length:20,label:"ft"},{pixels:1e4,factor:.00946969696,length:50,label:"ft"},{pixels:5e3,factor:.0189393939,length:100,label:"ft"},{pixels:2500,factor:.04734848,length:250,label:"ft"},{pixels:1e3,factor:.09469696,length:500,label:"ft"},{pixels:500,factor:.18939393,length:1e3,label:"ft"},{pixels:300,factor:.25,length:.25,label:"mi"},{pixels:180,factor:.5,length:.5,label:"mi"},{pixels:80,factor:1,length:1,label:"mi"},{pixels:40,factor:2,length:2,label:"mi"},{pixels:20,factor:5,length:5,label:"mi"},{pixels:8,factor:10,length:10,label:"mi"},{pixels:4,factor:25,length:25,label:"mi"},{pixels:1.5,factor:50,length:50,label:"mi"}],h=c({name:"MapScale",props:{corner:{type:String,required:!1}},data:()=>({globalState:i.state,showScale:!1,metric:{pixels:100,length:1e3,label:"m"},miles:{pixels:100,length:1e3,label:"mi"}}),mounted(){this.zoomChanged()},watch:{"globalState.viewState.zoom"(){this.zoomChanged()},"globalState.viewState.pitch"(){this.zoomChanged()},"globalState.viewState.latitude"(){this.zoomChanged()}},methods:{zoomChanged(){if(this.globalState.viewState.pitch>15||this.globalState.viewState.zoom<5){this.showScale=!1;return}this.showScale=!0;const o=2,t=156543.03,e=Math.PI/180*this.globalState.viewState.latitude,s=this.globalState.viewState.zoom,a=t*Math.cos(e)/2**s,l=o*1e3/a;this.calculateBestMeasurements(l)},calculateBestMeasurements(o){let t={pixels:o/200,length:5,label:"m"};for(let a=0;a<n.length;a++){const l=n[a];if(o>l.pixels)break;t={pixels:o*l.factor,length:l.length,label:l.label}}const e=o*1.609344;let s={pixels:10*e/5280,length:10,label:"ft"};for(let a=0;a<r.length;a++){const l=r[a];if(e>l.pixels)break;s={pixels:e*l.factor,length:l.length,label:l.label}}this.metric=t,this.miles=s}}});var g=function(){var t=this,e=t._self._c;return t._self._setupProxy,e("div",{directives:[{name:"show",rawName:"v-show",value:t.showScale,expression:"showScale"}],staticClass:"map-scale"},[e("div",{staticClass:"feet",class:{leftside:t.corner=="top-left"},style:{width:`${t.miles.pixels}px`}},[e("p",[t._v(t._s(t.miles.length)+" "+t._s(t.miles.label))])]),e("div",{staticClass:"meters",class:{leftside:t.corner=="top-left"},style:{width:`${t.metric.pixels}px`}},[e("p",[t._v(t._s(t.metric.length)+" "+t._s(t.metric.label))])])])},p=[];var b=m(h,g,p,!1,null,"04e85391",null,null);const u=b.exports,_={messages:{en:{in:"Zoom in",out:"Zoom out",center:"North"},de:{in:"Einzoomen",out:"Auszoomen",center:"Norden"}}},f=c({name:"ZoomButtons",i18n:_,components:{MapScale:u},props:{corner:String},data:()=>({globalState:i.state,zoomInFactor:.5,zoomOutFactor:.5,maxZoomIn:20,maxZoomOut:0,arrowRotation:0,location:0,smooth:[.0125,.025,.05,.1,.15,.2,.3,.4,.6,.7,.8,.85,.9,.95,.975,.9875,1]}),mounted(){this.corner&&this.corner.startsWith("top")&&(this.location=0),this.corner==="top-left"&&(this.location=1),this.corner&&this.corner.startsWith("bottom")&&(this.location=2)},watch:{"globalState.viewState.bearing"(){this.updateNorthArrow()}},computed:{cornerSettings(){let o={display:"flex",right:"7px"};return this.location==0&&(o=Object.assign(o,{flexDirection:"row",top:"5px"})),this.location==1&&(o=Object.assign(o,{flexDirection:"row-reverse",top:"5px",left:0,paddingLeft:0,right:"unset"})),this.location==2&&(o=Object.assign(o,{flexDirection:"column-reverse",bottom:"32px"})),o}},methods:{setNorth(){const o=i.state.viewState;for(let t=0;t<this.smooth.length;t++)setTimeout(()=>{const e=Object.assign({},o,{bearing:o.bearing-this.smooth[t]*o.bearing,pitch:o.pitch-this.smooth[t]*o.pitch});i.commit("setMapCamera",e)},24*t)},zoomIn(){let o=i.state.viewState.zoom;if(o+this.zoomInFactor<=this.maxZoomIn)for(let t=0;t<this.smooth.length;t++)setTimeout(()=>{const e={zoom:o+this.smooth[t]*this.zoomInFactor},s=i.state.viewState,a=Object.assign({},s,e);i.commit("setMapCamera",a)},16.67*t)},zoomOut(){var o=i.state.viewState.zoom;if(o-this.zoomOutFactor>=this.maxZoomOut)for(let t=0;t<this.smooth.length;t++)setTimeout(()=>{const e={zoom:o-this.smooth[t]*this.zoomInFactor},s=i.state.viewState,a=Object.assign({},s,e);i.commit("setMapCamera",a)},16.67*t)},updateNorthArrow(){this.arrowRotation=-1*this.globalState.viewState.bearing}}}),d="/assets/sw_plus_dm-addc2ce2.jpg",x="/assets/sw_plus-c32d0b8a.jpg",v="/assets/sw_minus_dm-92f86065.jpg",w="/assets/sw_minus-5b756579.jpg",S="/assets/sw_north_arrow_dm-aa6d011c.png",z="/assets/sw_north_arrow-5b7b9814.png";var k=function(){var t=this,e=t._self._c;return t._self._setupProxy,e("div",{staticClass:"map-complications",style:t.cornerSettings},[e("map-scale",{staticClass:"map-scale",attrs:{corner:t.corner}}),e("div",{staticClass:"zoom-buttons"},[e("div",{staticClass:"button-single button-top"},[t.globalState.isDarkMode?e("img",{staticClass:"img-button",attrs:{title:t.$t("in"),src:d},on:{click:function(s){return t.zoomIn()}}}):e("img",{staticClass:"img-button",attrs:{title:t.$t("in"),src:x},on:{click:function(s){return t.zoomIn()}}})]),e("div",{staticClass:"button-single"},[t.globalState.isDarkMode?e("img",{staticClass:"img-button",attrs:{title:t.$t("out"),src:v},on:{click:function(s){return t.zoomOut()}}}):e("img",{staticClass:"img-button",attrs:{title:t.$t("out"),src:w},on:{click:function(s){return t.zoomOut()}}})]),t.globalState.isDarkMode?e("div",{staticClass:"button-single button-bottom",style:{background:"rgb(43,60,78)",border:"1px solid rgb(119,119,119)"}},[t.globalState.isDarkMode?e("img",{staticClass:"img-button",style:{transform:`rotate(${t.arrowRotation}deg)`,background:"rgb(43,60,78)",height:"21px"},attrs:{title:t.$t("center"),src:S},on:{click:function(s){return t.setNorth()}}}):t._e()]):t._e(),t.globalState.isDarkMode?t._e():e("div",{staticClass:"button-single button-bottom",style:{border:"1px solid rgb(224,224,224)"}},[e("img",{staticClass:"img-button",style:{transform:`rotate(${t.arrowRotation}deg)`,height:"21px"},attrs:{title:t.$t("center"),src:z},on:{click:function(s){return t.setNorth()}}})])])],1)},C=[];var $=m(f,k,C,!1,null,"c4ef3c17",null,null);const y=$.exports;export{y as Z};
//# sourceMappingURL=ZoomButtons-9eff1228.js.map
