import{d as o,n as i}from"./index-0a2cd937.js";import n from"./TransitDemand-27a6e9a0.js";import"./turf.es-748c95cf.js";import"./index-311f326d.js";import"./index-4018348e.js";import"./papaparse.min-f24b18f6.js";import"./index-da0a180b.js";import"./CollapsiblePanel-b8168d54.js";import"./HTTPFileSystem-11bb8165.js";import"./NewXmlFetcher.worker-99a2f879.js";import"./DrawingTool-beef7098.js";import"./layer-b5f603da.js";import"./text-layer-f2f92fbd.js";import"./path-layer-cc4572cb.js";import"./ZoomButtons-9eff1228.js";import"./GzipFetcher.worker-a0a6e364.js";const s=o({name:"TransitPanel",components:{TransitDemand:n},props:{fileSystemConfig:{type:Object,required:!0},subfolder:{type:String,required:!0},files:{type:Array,required:!0},config:{type:Object,required:!0}},mounted(){this.$emit("isLoaded")},methods:{isLoaded(){this.$emit("isLoaded")}}});var m=function(){var e=this,t=e._self._c;return e._self._setupProxy,t("transit-demand",{staticClass:"deck-map",attrs:{root:e.fileSystemConfig.slug,subfolder:e.subfolder,config:e.config,thumbnail:!1},on:{isLoaded:e.isLoaded,error:function(r){return e.$emit("error",r)}}})},d=[];var a=i(s,m,d,!1,null,"ed49dfe4",null,null);const j=a.exports;export{j as default};
//# sourceMappingURL=transit-8ce2ec22.js.map
