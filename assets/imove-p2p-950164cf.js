import{d as o,n as i}from"./index-0a2cd937.js";import m from"./TripExplorer-98230ac6.js";import"./index-9f207cd3.js";import"./turf.es-748c95cf.js";import"./index-da0a180b.js";import"./index-8b446f14.js";import"./LineOffsetLayer-a1965fd1.js";import"./line-layer-100bce57.js";import"./layer-b5f603da.js";import"./PathOffsetLayer-60c6fdf8.js";import"./path-layer-cc4572cb.js";import"./set-rtl-text-plugin-9b0de6b6.js";import"./extends-98964cd2.js";import"./text-layer-f2f92fbd.js";import"./HTTPFileSystem-11bb8165.js";import"./DrawingTool-beef7098.js";import"./VizConfigurator-f229b006.js";import"./util-cf17ce82.js";import"./fxp-26b9b10f.js";import"./DataFetcher.worker-c87933e8.js";import"./ColorsAndWidths-e353667b.js";import"./cubehelix-658aafe4.js";import"./rainbow-b588906e.js";import"./threshold-6ccfe732.js";import"./index-f6506551.js";import"./LegendBox-f2f61fd8.js";import"./VuePlotly-5c981ebe.js";import"./ZoomButtons-9eff1228.js";import"./pureFunctionsAny.generated-fc6c8caf.js";const p=o({name:"ImovePanel",components:{TripExplorer:m},props:{fileSystemConfig:{type:Object,required:!0},subfolder:{type:String,required:!0},files:{type:Array,required:!0},config:{type:Object,required:!0},datamanager:Object},mounted(){this.$emit("isLoaded")},methods:{isLoaded(){this.$emit("isLoaded")}}});var n=function(){var r=this,e=r._self._c;return r._self._setupProxy,e("trip-explorer",{staticClass:"deck-map",attrs:{root:r.fileSystemConfig.slug,subfolder:r.subfolder,config:r.config,thumbnail:!1,datamanager:r.datamanager},on:{isLoaded:r.isLoaded,error:function(t){return r.$emit("error",t)}}})},a=[];var s=i(p,n,a,!1,null,"c160cf3e",null,null);const D=s.exports;export{D as default};
//# sourceMappingURL=imove-p2p-950164cf.js.map
