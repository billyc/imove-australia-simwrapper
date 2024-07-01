import { AsyncComponent, defineAsyncComponent } from 'vue'

// EVERY plugin must be registered here:

const plugins = [
  {
    kebabName: 'imove-explorer',
    filePatterns: ['**/viz-imove*.y?(a)ml'],
    component: defineAsyncComponent(() => import('./imove-trip-explorer/TripExplorer.vue')),
  },
  {
    kebabName: 'imove-p2p',
    filePatterns: ['**/viz-imove-p2p*.y?(a)ml'],
    component: defineAsyncComponent(() => import('./imove-point-to-point/TripExplorer.vue')),
  },
  {
    kebabName: 'x-y-t',
    filePatterns: ['**/viz-xyt-*.y?(a)ml', '**/*xyt.csv?(.gz)'],
    component: defineAsyncComponent(() => import('./xy-time/XyTime.vue')),
  },
  {
    kebabName: 'area-map',
    filePatterns: ['**/viz-map*.y?(a)ml', '**/*.geojson?(.gz)', '**/*.shp'],
    component: defineAsyncComponent(() => import('./shape-file/ShapeFile.vue')),
  },
  {
    kebabName: 'grid-map',
    filePatterns: ['**/viz-grid*.y?(a)ml'],
    component: defineAsyncComponent(() => import('./grid-map/GridMap.vue')),
  },
  {
    kebabName: 'vehicle-view',
    filePatterns: ['**/viz-vehicles*.y?(a)ml'],
    component: defineAsyncComponent(() => import('./vehicle-animation/VehicleAnimation.vue')),
  },
  {
    kebabName: 'xy-hexagons',
    filePatterns: ['**/viz-xy-*.y?(a)ml', '*output_trips.csv?(.gz)'],
    component: defineAsyncComponent(() => import('./xy-hexagons/XyHexagons.vue')),
  },
  {
    kebabName: 'plotly',
    filePatterns: ['**/plotly*.y?(a)ml'],
    component: defineAsyncComponent(() => import('./plotly/PlotlyDiagram.vue')),
  },
  {
    kebabName: 'vega-chart',
    filePatterns: ['**/*.vega.json'],
    component: defineAsyncComponent(() => import('./vega-lite/VegaLite.vue')),
  },
  {
    kebabName: 'image-view',
    filePatterns: ['!(*thumbnail*).(png|jpg)'], // skip thumbnails!
    component: defineAsyncComponent(() => import('./image/ImageView.vue')),
  },
  {
    kebabName: 'video-player',
    filePatterns: ['*.mp4'],
    component: defineAsyncComponent(() => import('./video-player/VideoPlayer.vue')),
  },
]

export const pluginComponents: { [key: string]: AsyncComponent } = {}
plugins.forEach(p => {
  pluginComponents[p.kebabName] = p.component
})

export default plugins
