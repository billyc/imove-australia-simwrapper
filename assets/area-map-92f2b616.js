import i from"./ShapeFile-768b2d6b.js";import{n as m}from"./index-0a2cd937.js";import"./index-6bd64dc8.js";import"./Coords-23d23a7c.js";import"./index-e24927de.js";import"./turf.es-748c95cf.js";import"./index-da0a180b.js";import"./set-rtl-text-plugin-9b0de6b6.js";import"./layer-b5f603da.js";import"./extends-98964cd2.js";import"./LineOffsetLayer-a1965fd1.js";import"./line-layer-100bce57.js";import"./PathOffsetLayer-60c6fdf8.js";import"./path-layer-cc4572cb.js";import"./DrawingTool-beef7098.js";import"./text-layer-f2f92fbd.js";import"./cubehelix-658aafe4.js";import"./data-filter-a3d4df23.js";import"./layer-extension-bad13847.js";import"./ColorsAndWidths-e353667b.js";import"./rainbow-b588906e.js";import"./threshold-6ccfe732.js";import"./index-f6506551.js";import"./VizConfigurator-f229b006.js";import"./util-cf17ce82.js";import"./HTTPFileSystem-11bb8165.js";import"./fxp-26b9b10f.js";import"./DataFetcher.worker-c87933e8.js";import"./index-8b446f14.js";import"./LegendBox-f2f61fd8.js";import"./ZoomButtons-9eff1228.js";import"./DashboardDataManager-c75a1cc2.js";import"./RoadNetworkLoader.worker-48aaa0eb.js";import"./group-f6e6d4c5.js";import"./LegendStore-3aadd543.js";import"./zip-96e4f4e1.js";import"./min-7292b72b.js";import"./sum-2c3bc3a6.js";const e={name:"AreaMapPanel",components:{ShapeFile:i},props:{config:Object,datamanager:Object,fileSystemConfig:Object,subfolder:String,yamlConfig:String},methods:{isLoaded(){this.$emit("isLoaded")}}};var p=function(){var o=this,r=o._self._c;return r("shape-file",{staticClass:"deck-map",attrs:{root:o.fileSystemConfig.slug,subfolder:o.subfolder,configFromDashboard:o.config,thumbnail:!1,datamanager:o.datamanager,yamlConfig:"config"},on:{isLoaded:o.isLoaded,error:function(t){return o.$emit("error",t)}}})},a=[];var n=m(e,p,a,!1,null,"e4390d58",null,null);const U=n.exports;export{U as default};
//# sourceMappingURL=area-map-92f2b616.js.map
