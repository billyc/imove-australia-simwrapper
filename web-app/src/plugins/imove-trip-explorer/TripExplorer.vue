<template lang="pug">
.link-volume-plot(:class="{'hide-thumbnail': !thumbnail}"
        :style='{"background": urlThumbnail}'
        oncontextmenu="return false")

  .details-panel
    h3.center RELIABILITY EXPLORER
    p.center
      br
      | {{ numTrips ? '&nbsp;' : 'Select an intersection.' }}

    .statistics
      h3 Trips
      h4(v-if="numTrips") {{numTrips}} trip{{ numTrips == 1 ? '' : 's'}} found
      h4(v-else) &nbsp;

      br
      p Day of Week
      b-button.is-small(@click="toggleDay(0)" :type="dayOfWeek[0]") Mo
      b-button.is-small(@click="toggleDay(1)" :type="dayOfWeek[1]") Tu
      b-button.is-small(@click="toggleDay(2)" :type="dayOfWeek[2]") We
      b-button.is-small(@click="toggleDay(3)" :type="dayOfWeek[3]") Th
      b-button.is-small(@click="toggleDay(4)" :type="dayOfWeek[4]") Fr
      b-button.is-small(@click="toggleDay(5)" :type="dayOfWeek[5]") Sa
      b-button.is-small(@click="toggleDay(6)" :type="dayOfWeek[6]") Su
      br
      br
      p Vehicle Types
      b-button.is-small(@click="toggleVehicle(0)" :type="vehType[0]") All
      b-button.is-small(@click="toggleVehicle(1)" :type="vehType[1]") Cars
      b-button.is-small(@click="toggleVehicle(2)" :type="vehType[2]") HCV

      br
      br

    .reliability
      h3 Reliability
      p Speed by time of day
      br
      p: b Average speed: {{ Math.round(10* avgSpeed) / 10 }}

      vue-plotly.myplot(v-if="speedData.length"
        :data="speedData"
        :layout="layout"
        :options="options"
        id="speed-plot"
      )

  .plot-container(:id="`container-${linkLayerId}`")
    link-layer.map-area(
        :viewId="linkLayerId"
        :colorRampType="colorRampType"
        :dark="isDarkMode"
        :projection="vizDetails.projection"
        :mapIsIndependent="vizDetails.mapIsIndependent"
        :click="handleClick"
        :paths="selectedPaths"
    )

    zoom-buttons.zoom-buttons(v-if="!thumbnail")

    .bottom-panel(v-if="!thumbnail")
      .status-message(v-if="myState.statusMessage")
        p {{ myState.statusMessage }}


</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { ToggleButton } from 'vue-js-toggle-button'
import YAML from 'yaml'

import globalStore from '@/store'
import { MAP_STYLES_OFFLINE, DataType, LookupDataset, UI_FONT, BG_COLOR_DASHBOARD } from '@/Globals'
import SelectorPanel from './SelectorPanel.vue'
import LinkLayer from './LinkLayer'
import HTTPFileSystem from '@/js/HTTPFileSystem'
import VuePlotly from '@/components/VuePlotly.vue'
import ZoomButtons from '@/components/ZoomButtons.vue'
import LegendStore from '@/js/LegendStore'

import {
  ColorScheme,
  FileSystem,
  FileSystemConfig,
  VisualizationPlugin,
  Status,
  REACT_VIEW_HANDLES,
} from '@/Globals'

const MyComponent = defineComponent({
  name: 'ReliabilityExplorer',
  components: {
    SelectorPanel,
    LinkLayer,
    ToggleButton,
    VuePlotly,
    ZoomButtons,
  },
  props: {
    root: { type: String, required: true },
    subfolder: { type: String, required: true },
    yamlConfig: String,
    config: Object as any,
    thumbnail: Boolean,
  },
  data() {
    return {
      apiKey: '',
      serverRetries: 0,
      selectedPaths: [] as any[],
      numTrips: 0,
      avgSpeed: 0,
      dayOfWeek: ['is-warning', 'is-warning', 'is-warning', 'is-warning', 'is-warning', '', ''],
      vehType: ['is-success', '', ''],
      currentCoord: [] as number[],
      radius: 0.0002,

      speedData: [] as any[],
      globalState: globalStore.state,
      layout: {
        paper_bgcolor: BG_COLOR_DASHBOARD.dark,
        plot_bgcolor: BG_COLOR_DASHBOARD.dark,
        font: { family: UI_FONT, color: '#cccccc' },
        height: 300,
        margin: { t: 8, b: 0, l: 0, r: 0, pad: 2 },
        xaxis: {
          automargin: true,
          autorange: true,
          title: { text: 'Hour', standoff: 12 },
          animate: true,
        },
        yaxis: {
          automargin: true,
          autorange: true,
          title: { text: 'Speed', standoff: 16 },
          animate: true,
        },
        legend: false,
        // {
        //   orientation: 'h',
        //   x: 1,
        //   y: 1,
        // },
      },
      options: {
        displaylogo: false,
        responsive: true,
        modeBarButtonsToRemove: [
          'pan2d',
          'zoom2d',
          'select2d',
          'lasso2d',
          'zoomIn2d',
          'zoomOut2d',
          'autoScale2d',
          'hoverClosestCartesian',
          'hoverCompareCartesian',
          'resetScale2d',
          'toggleSpikelines',
          'resetViewMapbox',
        ],
        toImageButtonOptions: {
          format: 'png', // one of png, svg, jpeg, webp
          filename: 'scatter-plot',
          width: null,
          height: null,
        },
      },

      standaloneYAMLconfig: {
        title: '',
        description: '',
        csvFile: '',
        csvBase: '',
        datasets: {} as { [id: string]: string },
        useSlider: false,
        showDifferences: false,
        shpFile: '',
        dbfFile: '',
        network: '',
        geojsonFile: '',
        projection: '',
        center: null as any,
        zoom: 0,
        widthFactor: null as any,
        thumbnail: '',
        sum: false,
        nodes: '', // SFCTA nodes shapefile
        links: [] as string[], // SFCTA links DBF files
        mapIsIndependent: false,
        display: {
          color: {} as any,
          width: {} as any,
        },
      },

      YAMLrequirementsLinks: {
        // csvFile: '',
        // network: '',
        // projection: '',
      },

      // this contains the display settings for this view; it is the View Model.
      // use changeConfiguration to modify this for now (todo: move to state model)
      vizDetails: {
        title: '',
        description: '',
        csvFile: '',
        csvBase: '',
        datasets: {} as { [id: string]: string },
        useSlider: false,
        showDifferences: false,
        server: '',
        shpFile: '',
        dbfFile: '',
        network: '',
        geojsonFile: '',
        projection: '',
        center: null as any,
        zoom: 0,
        widthFactor: null as any,
        thumbnail: '',
        sum: false,
        nodes: '', // SFCTA nodes shapefile
        links: [] as string[], // SFCTA links DBF files
        mapIsIndependent: false,
        display: {
          color: {} as any,
          width: {} as any,
        },
      },

      currentUIFilterDefinitions: {} as any,
      isButtonActiveColumn: false,
      linkLayerId: `linklayer-${Math.floor(1e12 * Math.random())}` as any,
      scaleWidth: 0,
      numLinks: 0,
      showTimeRange: false,
      legendStore: new LegendStore(),
      geojsonData: {
        source: new Float32Array(),
        dest: new Float32Array(),
        linkIds: [] as any[],
        projection: '',
      },
      fixedColors: ['#4e79a7'],
      myState: {
        statusMessage: '',
        subfolder: '',
        yamlConfig: '',
        thumbnail: false,
      },

      isDarkMode: this.$store.state.colorScheme === ColorScheme.DarkMode,
      isDataLoaded: false,
      thumbnailUrl: "url('assets/thumbnail.jpg') no-repeat;",

      resizer: undefined as ResizeObserver | undefined,
    }
  },
  computed: {
    fileApi(): HTTPFileSystem {
      return new HTTPFileSystem(this.fileSystem, globalStore)
    },

    fileSystem(): FileSystemConfig {
      const svnProject: FileSystemConfig[] = this.$store.state.svnProjects.filter(
        (a: FileSystemConfig) => a.slug === this.root
      )
      if (svnProject.length === 0) {
        console.log('no such project')
        throw Error
      }
      return svnProject[0]
    },

    urlThumbnail(): string {
      return this.thumbnailUrl
    },

    colorRampType(): any {
      const rampType = this.vizDetails.display.color?.colorRamp?.style
      if (rampType === undefined) return -1
      return rampType
    },
  },
  watch: {
    '$store.state.viewState'() {
      if (this.vizDetails.mapIsIndependent) return

      if (!REACT_VIEW_HANDLES[this.linkLayerId]) return
      REACT_VIEW_HANDLES[this.linkLayerId]()
    },

    '$store.state.colorScheme'() {
      setTimeout(
        () => (this.isDarkMode = this.$store.state.colorScheme === ColorScheme.DarkMode),
        100
      )
    },
  },
  methods: {
    toggleDay(i: number) {
      this.dayOfWeek[i] = this.dayOfWeek[i] ? '' : 'is-warning'
      this.dayOfWeek = [...this.dayOfWeek]
    },

    toggleVehicle(i: number) {
      // radio buttons - only one selection
      this.vehType = ['', '', '']
      this.vehType[i] = 'is-success'
    },

    setDataIsLoaded() {
      this.isDataLoaded = true
    },

    async getVizDetails() {
      const filename = this.myState.yamlConfig

      const emptyState = {
        showDifferences: false,
        datasets: {} as any,
        display: { color: {} as any, width: {} as any },
      }

      // are we in a dashboard?
      if (this.config) {
        this.vizDetails = Object.assign({}, emptyState, this.config)
        return
      }

      // was a YAML file was passed in?
      if (filename?.endsWith('yaml') || filename?.endsWith('yml')) {
        await this.loadStandaloneYamlConfig()
      }

      const t = this.vizDetails.title ? this.vizDetails.title : filename || 'Trip Explorer'
      this.$emit('title', t)
    },

    async loadStandaloneYamlConfig() {
      try {
        const filename =
          this.myState.yamlConfig.indexOf('/') > -1
            ? this.myState.yamlConfig
            : this.myState.subfolder + '/' + this.myState.yamlConfig

        const text = await this.fileApi.getFileText(filename)
        this.standaloneYAMLconfig = Object.assign({}, YAML.parse(text))
        this.setVizDetails()
      } catch (err) {
        console.error('failed', '' + err)
      }
    },

    setVizDetails() {
      this.vizDetails = Object.assign({}, this.vizDetails, this.standaloneYAMLconfig)
    },

    async fetchWithAuthorization(url: string) {
      console.log('fetchTrips', this.serverRetries)
      const trips = (await fetch(url, {
        headers: { Authorization: this.apiKey, 'Access-Control-Allow-Origin': '*' },
      }).then(async response => {
        console.log(1, { response })
        if (response.status == 200) {
          console.log(200)
          this.serverRetries = 0
          return response.json()
        }
        if (response.status == 403) {
          console.log(403)
          // try again
          this.serverRetries += 1
          this.forceApiAuthorization()
          return await this.fetchWithAuthorization(url)
        } else if (this.serverRetries < 5) {
          // wait 2 seconds and retry
          this.serverRetries += 1
          this.myState.statusMessage = `Contacting server... (${this.serverRetries})`
          await new Promise(r => setTimeout(r, 2000))
          return await this.fetchWithAuthorization(url)
        }
        throw Error('API ERROR: ' + response.statusText)
      })) as any[]

      return trips
    },

    async handleClick(event: any) {
      console.log('GOT YOU:', event)
      if (event.coordinate) {
        await this.clickedCoordinate(event.coordinate)
        await this.runStatisticsForCoord(event.coordinate)
      }
    },

    async runStatisticsForCoord(coord: number[]) {
      this.currentCoord = coord
      console.log('number of PATHS:', this.selectedPaths)
      const lonLo = coord[0] - this.radius
      const lonHi = coord[0] + this.radius
      const latLo = coord[1] - this.radius
      const latHi = coord[1] + this.radius

      const data = { time: [], speeds: [] } as any

      for (const selectedPath of this.selectedPaths) {
        const path = selectedPath.path
        console.log('  number of POINTS:', path.length)

        let lastSelectedPointIndex = 0
        for (let i = 0; i < path.length; i++) {
          const p = path[i]
          if (p[0] >= lonLo && p[0] <= lonHi && p[1] >= latLo && p[1] <= latHi) {
            lastSelectedPointIndex = i
          }
        }
        console.log('  i:', lastSelectedPointIndex)

        // might be at end of array, don't panic
        try {
          const speed = selectedPath.speeds[lastSelectedPointIndex]
          const startTime = parseInt(selectedPath.startTime.substring(0, 2))
          if (speed == 0) continue

          data.time.push(startTime)
          data.speeds.push(speed)
        } catch (e) {
          console.warn('bad index')
          // ignore for now
        }

        // calc average
        const sum = data.speeds.reduce((a: number, b: number) => a + b)
        const avgSpeed = sum / data.speeds.length
        this.avgSpeed = avgSpeed
      }
      console.log(data)

      this.speedData = [
        {
          x: data.time,
          y: data.speeds,
          name: 'Speed by Hour',
          mode: 'markers',
          type: 'scatter',
          textinfo: 'label+percent',
          textposition: 'inside',
          automargin: true,
          showlegend: false,
          marker: { size: 3, color: '#ff4' },
        },
      ]
    },

    async clickedCoordinate(coord: number[]) {
      const [lon, lat] = coord
      console.log({ lon, lat })

      const server = this.vizDetails.server

      // GET TRIP LIST
      const url = `${server}/location?lon=${lon}&lat=${lat}&radius=0.0002`
      console.log(url)
      const trips = await this.fetchWithAuthorization(url)
      // console.log({ trips })

      if (!trips.length) {
        this.selectedPaths = []
        this.numTrips = 0
        return
      }

      // BUILD PATHS
      const selectedPaths = [] as any[]

      // GET FULL PATHS FOR SELECTED TRIPS
      this.numTrips = trips.length

      // only fetch 800 at a time due to URL length limits
      const chunk = 807

      let i = 0
      while (i < this.numTrips) {
        console.log('loading', i)
        const tripIDs = trips
          .slice(i, i + chunk)
          .map((trip: any) => trip.TripID)
          .join(',')
        const pathUrl = `${server}/path?trip=${tripIDs}`
        console.log('path length:', pathUrl.length)
        const paths = await this.fetchWithAuthorization(pathUrl)

        for (const trip of paths) {
          const snappedPath = trip.Path1
          const coords = snappedPath
            .split(',')
            .map((point: string) => point.split(' ').map(p => parseFloat(p)))

          const speeds = trip.Speed_path.split(',').map((speed: any) => parseFloat(speed))

          selectedPaths.push({ path: coords, speeds, startTime: trip.start_time })
        }
        this.selectedPaths = [...selectedPaths]
        await this.$nextTick()
        i += chunk
      }
    },

    setMapCenterFromVizDetails() {
      if (typeof this.vizDetails.center == 'string') {
        this.vizDetails.center = this.vizDetails.center.split(',').map(Number)
      }

      if (!this.vizDetails.zoom) {
        this.vizDetails.zoom = 9
      }

      this.$store.commit('setMapCamera', {
        longitude: this.vizDetails.center[0],
        latitude: this.vizDetails.center[1],
        bearing: 0,
        pitch: 0,
        zoom: this.vizDetails.zoom,
        jump: false,
      })

      const view = {
        longitude: this.vizDetails.center[0],
        latitude: this.vizDetails.center[1],
        bearing: 0,
        pitch: 0,
        zoom: this.vizDetails.zoom || 10, // use 10 default if we don't have a zoom
        jump: false, // move the map no matter what
      }

      // bounce our map
      if (REACT_VIEW_HANDLES[this.linkLayerId]) {
        REACT_VIEW_HANDLES[this.linkLayerId](view)
      }
    },

    async setMapCenter() {
      if (this.vizDetails.center) return this.setMapCenterFromVizDetails()

      const data = this.geojsonData

      if (!data.source.length) return

      let samples = 0
      let longitude = 0
      let latitude = 0

      // figure out the center
      if (this.geojsonData.projection !== 'Atlantis') {
        const numLinks = data.source.length / 2
        const gap = numLinks < 4096 ? 2 : 1024
        for (let i = 0; i < numLinks; i += gap) {
          longitude += data.source[i * 2]
          latitude += data.source[i * 2 + 1]
          samples++
        }
        longitude = longitude / samples
        latitude = latitude / samples
      }
      console.log('center', longitude, latitude)

      this.$store.commit('setMapCamera', {
        longitude,
        latitude,
        bearing: 0,
        pitch: 0,
        zoom: 8,
        jump: false,
      })
    },

    setupLogoMover() {
      this.resizer = new ResizeObserver(this.moveLogo)
      const deckmap = document.getElementById(`container-${this.linkLayerId}`) as HTMLElement
      this.resizer.observe(deckmap)
    },

    moveLogo() {
      const deckmap = document.getElementById(`container-${this.linkLayerId}`) as HTMLElement
      const logo = deckmap?.querySelector('.mapboxgl-ctrl-bottom-left') as HTMLElement
      if (logo) {
        const right = deckmap.clientWidth > 640 ? '280px' : '36px'
        logo.style.right = right
      }
    },

    async updateStatus(message: string) {
      this.myState.statusMessage = message
    },

    getApiAuthorization() {
      console.log('GETAPI')
      let auth = localStorage.getItem('imove-api-key')
      if (!auth) auth = prompt('API access key required:')

      if (auth) {
        this.apiKey = auth
        localStorage.setItem('imove-api-key', auth)
      }
    },

    forceApiAuthorization() {
      localStorage.removeItem('imove-api-key')
      this.getApiAuthorization()
    },

    async wakeUpServer() {
      // this is a throwaway fetch that simply wakes up the API server when we load the site
      try {
        fetch(this.vizDetails.server)
      } catch (e) {
        // ignore
      }
    },
  },

  async mounted() {
    this.$store.commit('setFullScreen', !this.thumbnail)

    this.myState.thumbnail = this.thumbnail
    this.myState.yamlConfig = this.yamlConfig ?? ''
    this.myState.subfolder = this.subfolder

    await this.getVizDetails()

    this.wakeUpServer()

    this.setupLogoMover()
    console.log('ok')
  },

  beforeDestroy() {
    // MUST delete the React view handle to prevent gigantic memory leak!
    delete REACT_VIEW_HANDLES[this.linkLayerId]
    this.$store.commit('setFullScreen', false)
  },
})

export default MyComponent
</script>

<style scoped lang="scss">
@import '@/styles.scss';

.link-volume-plot {
  min-height: $thumbnailHeight;
  display: flex;
  flex-direction: row-reverse;
  height: 100%;
}

.link-volume-plot.hide-thumbnail {
  background: var(--bgMapPanel);
}

.plot-container {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr auto auto;
  pointer-events: auto;
  flex: 1;
  position: relative;
}

.map-area {
  pointer-events: auto;
}

.details-panel {
  width: 22rem;
  // background-color: #373641;
  background: linear-gradient(35deg, #034a71, #2c5241);
  background: linear-gradient(35deg, #2c5241, #034a71);
  padding: 0.5rem 1rem;
  color: #eee;
  // border-left: 1px solid #557;
  display: flex;
  flex-direction: column;
}
.top-panel {
  pointer-events: auto;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  background-color: var(--bgPanel);
  margin: 0 auto auto 0;
  padding: 0.5rem 1.5rem 1rem 1.5rem;
  z-index: 5;
  box-shadow: 0px 2px 10px #22222244;
}

.bottom-panel {
  grid-column: 1 / 3;
  grid-row: 2 / 3;
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  pointer-events: auto;
  margin: auto 0.5rem 2px 7px;
  filter: drop-shadow(0px 2px 4px #22222233);
}

.status-message {
  margin: 0 0 0.5rem 0;
  padding: 0.5rem 0.5rem;
  color: var(--textFancy);
  background-color: var(--bgPanel);
  font-size: 1.2rem;
  line-height: 1.5rem;
}

.right-side {
  z-index: 1;
  display: flex;
  flex-direction: row;
  margin: 0 0 auto 0;
}

.panel-items {
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0.5rem;
  margin-bottom: 5px;
  width: 16rem;
  background-color: var(--bgPanel);
  border-radius: 3px;
  overflow: visible;
  // overflow-x: hidden;
}

h3 {
  line-height: 1.7rem;
  margin-top: 1rem;
}

input {
  border: none;
  background-color: var(--bgCream2);
  color: var(--bgDark);
}

.toggle {
  margin: 0.25rem 0.5rem 0.25rem 0;
}

#dropdown-menu-color-selector {
  background-color: var(--bgBold);

  p {
    color: #888;
  }
}

.panel-item {
  margin-top: 0rem;
}

.config-section {
  flex: 1;
}

.diff-section {
  display: flex;
  flex-direction: row;
  margin-top: 0.7rem;

  p {
    margin: auto 0;
  }
}

.filter-panel {
  height: 6rem;
  background-color: var(--bgPanel);
  margin: 0rem auto 5px 0px;
  border-radius: 3px;
  // width: 100%;
}

.statistics {
  flex: 1;
}

.reliability {
  flex: 1;
  margin-bottom: 1rem;
}

.myplot {
  margin-top: 0.5rem;
}
</style>
