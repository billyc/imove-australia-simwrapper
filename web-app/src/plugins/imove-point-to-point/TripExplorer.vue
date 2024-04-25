<template lang="pug">
.link-volume-plot(:class="{'hide-thumbnail': !thumbnail}"
        :style='{"background": urlThumbnail}'
        oncontextmenu="return false")

  .details-panel
    h4.center: b POINT-TO-POINT

    p.button-section Start Time
    .flex-row
      .flex1: b-button.is-small(expanded @click="toggleTime(0)" :type="timeOfDay[0]") All
      .flex1: b-button.is-small(expanded @click="toggleTime(1)" :type="timeOfDay[1]") 8am-9am
      .flex1: b-button.is-small(expanded @click="toggleTime(2)" :type="timeOfDay[2]") 1pm-2pm
      .flex1: b-button.is-small(expanded @click="toggleTime(3)" :type="timeOfDay[3]") 5pm-6pm

    p.button-section Day of Week
    .flex-row
      .flex1: b-button.is-small(expanded @click="toggleDay(7)" :type="dayOfWeek[7]") All
      .flex1: b-button.flex1.is-small(expanded @click="toggleDay(8)" :type="dayOfWeek[8]") Mo-Fr
      .flex1: b-button.flex1.is-small(expanded @click="toggleDay(9)" :type="dayOfWeek[9]") Sa-Su

    p.button-section Vehicle Types
    .flex-row
      .flex1: b-button.is-small(expanded @click="toggleVehicle(0)" :type="vehType[0]") All
      .flex1: b-button.is-small(expanded @click="toggleVehicle(1)" :type="vehType[1]") Cars
      .flex1: b-button.is-small(expanded @click="toggleVehicle(2)" :type="vehType[2]") HCV

    .statistics
      h4: b Trips
      p(v-if="numTrips > 0") {{numTrips}} trip{{ numTrips == 1 ? '' : 's'}} found
      h4(v-else) &nbsp;

    .reliability(v-if="avgSpeed")
      h4: b Speed Reliability, A to B
      p
        | Average speed:&nbsp;&nbsp;
        b: span(style="color: yellow") {{ Math.round(10* avgSpeed) / 10 }} km/h
        p
        | Std. deviation speed:&nbsp;&nbsp;
        b: span(style="color: yellow") {{ Math.round(100* stdSpeed) / 100 }}
      p
        | Coeff. of variation:&nbsp;&nbsp;
        b: span(style="color: yellow") {{ Math.round(100* cvSpeed) / 100 }}

    //- STATISTICS / BOXPLOT --------------
    //- v-if="boxplot.length"
    //- :class="{'is-filtering': isFiltering || isStatisticking}"
    vue-plotly.stats-plot(v-if="boxplot.length"
      :data="boxplot"
      :layout="layoutBoxplot"
      :options="options"
      id="box-plot"
    )

    //- STATISTICS / Time vs. Distance -----------
    //- v-if="speedData.length"
    //- :class="{'is-filtering': isFiltering || isStatisticking}"
    vue-plotly.stats-plot(v-if="speedData.length"
      :data="speedData"
      :layout="layoutSpeed"
      :options="options"
      id="speed-plot"
    )

  //- MAP PLOT WITH TRACES --------------
  .plot-container(:id="`container-${linkLayerId}`")
    link-layer.map-area(
        :viewId="linkLayerId"
        :paths="selectedPaths"
        :dark="isDarkMode"
        :mapIsIndependent="vizDetails.mapIsIndependent"
        :click="handleClick"
        :startCoord="startCoord"
        :endCoord="endCoord"
    )

    zoom-buttons.zoom-buttons(v-if="!thumbnail" corner="top-left")

    .info-panel(v-show="numTrips <= 0")
      p {{ numTrips == -1 ? 'No trips pass between those points. Zoom in, try again' : prompt[numIntersectionsSelected] }}
      .status-message(v-if="myState.statusMessage")
        p {{ myState.statusMessage }}

</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'

import { ToggleButton } from 'vue-js-toggle-button'
import { length } from '@turf/turf'
import { mean, std } from 'mathjs'
import moment from 'moment'
import YAML from 'yaml'

import globalStore from '@/store'
import { DataTable, LookupDataset, UI_FONT, BG_COLOR_DASHBOARD } from '@/Globals'
import SelectorPanel from './SelectorPanel.vue'
import LinkLayer from './DeckLayers'
import HTTPFileSystem from '@/js/HTTPFileSystem'
import DrawingTool from '@/components/DrawingTool/DrawingTool.vue'
import VizConfigurator from '@/components/viz-configurator/VizConfigurator.vue'
import VuePlotly from '@/components/VuePlotly.vue'
import ZoomButtons, { Corner } from '@/components/ZoomButtons.vue'
import LegendStore from '@/js/LegendStore'

import { ColorScheme, FileSystemConfig, REACT_VIEW_HANDLES } from '@/Globals'

const MyComponent = defineComponent({
  name: 'NetworkLinksPlugin',
  components: {
    SelectorPanel,
    DrawingTool,
    LinkLayer,
    ToggleButton,
    VizConfigurator,
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
      isFiltering: false,
      isStatisticking: false,
      prompt: [
        'Select an intersection on the map',
        'Select second intersection',
        'Querying data...',
      ],
      selectedPaths: [] as any[],
      serverRetries: 0,
      numTrips: 0,
      avgSpeed: 0,
      cvSpeed: 0,
      stdSpeed: 0,
      unfilteredTrips: [] as any[],
      dayOfWeek: ['', '', '', '', '', '', '', 'is-warning', '', ''],
      timeOfDay: ['is-success', '', ''],
      vehType: ['is-success', '', ''],
      currentCoord: [] as number[],
      startCoord: [] as number[],
      endCoord: [] as number[],
      numIntersectionsSelected: 0,
      radius: 0.0002,
      speedData: [] as any[],
      boxplot: [] as any[],
      globalState: globalStore.state,
      layoutSpeed: {
        paper_bgcolor: '#223', // BG_COLOR_DASHBOARD.dark,
        plot_bgcolor: '#223', // BG_COLOR_DASHBOARD.dark,
        font: { family: UI_FONT, color: '#cccccc' },
        autosize: true,
        margin: { t: 8, b: 2, l: 0, r: 0, pad: 2 },
        xaxis: {
          automargin: true,
          autorange: true,
          title: { text: 'Distance, km', standoff: 12 },
          animate: true,
        },
        yaxis: {
          automargin: true,
          autorange: true,
          title: { text: 'Seconds', standoff: 16 },
          animate: true,
        },
        legend: false,
        // {
        //   orientation: 'h',
        //   x: 1,
        //   y: 1,
        // },
      },
      layoutBoxplot: {
        paper_bgcolor: '#223', // BG_COLOR_DASHBOARD.dark,
        plot_bgcolor: '#223', // BG_COLOR_DASHBOARD.dark,
        font: { family: UI_FONT, color: '#cccccc' },
        autosize: true,
        margin: { t: 8, b: 2, l: 0, r: 0, pad: 2 },
        xaxis: {
          automargin: true,
          autorange: true,
          title: '',
          animate: true,
        },
        yaxis: {
          automargin: true,
          autorange: true,
          title: { text: 'Speed, km/h', standoff: 16 },
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

      // this contains the display settings for this view; it is the View Model.
      // use changeConfiguration to modify this for now (todo: move to state model)
      vizDetails: {
        title: '',
        description: '',
        server: '',
        network: '',
        projection: '',
        center: null as any,
        zoom: 0,
        thumbnail: '',
        sum: false,
        mapIsIndependent: false,
      },

      currentUIFilterDefinitions: {} as any,
      datasets: {} as { [id: string]: DataTable },
      isButtonActiveColumn: false,
      linkLayerId: `linklayer-${Math.floor(1e12 * Math.random())}` as any,
      numLinks: 0,
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
      csvRowLookupFromLinkRow: {} as { [datasetId: string]: number[] },
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
    clearMap() {
      this.startCoord = []
      this.endCoord = []
      this.numTrips = 0
      this.numIntersectionsSelected = 0
      this.selectedPaths = []
    },

    toggleDay(i: number) {
      this.dayOfWeek = ['', '', '', '', '', '', '', '', '', '']
      this.dayOfWeek[i] = 'is-warning'
      this.updateFilter()
    },

    toggleTime(i: number) {
      this.timeOfDay = ['', '', '']
      this.timeOfDay[i] = 'is-success'
      this.updateFilter()
    },

    toggleVehicle(i: number) {
      // radio buttons - only one selection
      this.vehType = ['', '', '']
      this.vehType[i] = 'is-success'
      this.updateFilter()
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

    async handleClick(event: any) {
      console.log('GOT YOU:', event)

      try {
        if (event.coordinate) {
          await this.clickedCoordinate(event.coordinate)
          // await this.runStatisticsForCoord(event.coordinate)
        }
      } catch (e) {
        console.error('bad!' + e)
        this.numTrips = -1
      }
      console.log(this.numTrips)
    },

    runStatistics() {
      this.isStatisticking = true

      const distanceAndTime = [] as any[]
      let minDistance = Infinity

      const feature = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [] as any,
        },
      } as any

      // loop on each path
      for (const path of this.selectedPaths) {
        let startIndex = -1
        let endIndex = -1

        // first we look for a point within the starting point
        let lonLo = this.startCoord[0] - this.radius
        let lonHi = this.startCoord[0] + this.radius
        let latLo = this.startCoord[1] - this.radius
        let latHi = this.startCoord[1] + this.radius

        for (let i = 0; i < path.path.length; i++) {
          const p = path.path[i]
          if (p[0] >= lonLo && p[0] <= lonHi && p[1] >= latLo && p[1] <= latHi) {
            startIndex = i
            break
          }
        }
        if (startIndex < 0) continue

        // console.log('pathlength', path.path.length, 'startIndex', startIndex)

        // then we look for end point and sum the travel times
        lonLo = this.endCoord[0] - this.radius
        lonHi = this.endCoord[0] + this.radius
        latLo = this.endCoord[1] - this.radius
        latHi = this.endCoord[1] + this.radius
        for (let i = startIndex; i < path.path.length; i++) {
          const p = path.path[i]
          if (p[0] >= lonLo && p[0] <= lonHi && p[1] >= latLo && p[1] <= latHi) {
            endIndex = i
            break
          }
        }
        if (endIndex < 0) continue

        // console.log(startIndex, endIndex)

        // WE should have both now

        feature.geometry.coordinates = path.path.slice(startIndex, endIndex + 1)
        const distance = length(feature, { units: 'kilometers' })

        // times
        const startTime = moment(path.timestamps[startIndex], 'HH:mm:ss')
        const endTime = moment(path.timestamps[endIndex - 1], 'HH:mm:ss')
        const diffSeconds = endTime.diff(startTime) / 1000.0

        // no zeroes please
        if (diffSeconds) distanceAndTime.push([distance, diffSeconds])

        // remember minimum distance
        minDistance = Math.min(minDistance, distance)
      }

      // Clip outliers: drop distances greater than 150% of minimum distance
      // because some trips are not directly between the two points
      const clipValue = minDistance * 1.5
      const clipped = distanceAndTime.filter(p => p[0] < clipValue)
      console.log({ clipped })
      this.speedData = [
        {
          x: clipped.map(p => p[0]),
          y: clipped.map(p => p[1]),
          name: 'Travel Times from A to B',
          mode: 'markers',
          type: 'scatter',
          textinfo: 'label+percent',
          textposition: 'inside',
          automargin: true,
          showlegend: false,
          marker: { size: 3, color: '#ff4' },
        },
      ]

      let speeds = [] as any[]

      try {
        // calc metrics: avg speed, coeff of variance
        speeds = clipped.map(p => (3600 * p[0]) / p[1]) // km/hour
        const meanSpeed = mean(speeds)
        const stdSpeed = std(speeds) as any
        const cv = stdSpeed / meanSpeed
        console.log({ meanSpeed, stdSpeed, cv })
        this.avgSpeed = meanSpeed
        this.cvSpeed = cv
        this.stdSpeed = stdSpeed
      } catch (e) {
        console.error('' + e)
      }

      // BOX PLOT
      this.boxplot = [
        {
          y: speeds,
          boxpoints: 'all',
          jitter: 0.3,
          pointpos: -1.5,
          type: 'box',
          name: '',
          marker: { size: 3, color: '#37f' },
        },
      ]

      //   const sum = data.speeds.reduce((a: number, b: number) => a + b)
      //   const avgSpeed = sum / data.speeds.length
      //   this.avgSpeed = avgSpeed
      // }
      this.isStatisticking = false
    },

    async updateFilter() {
      if (!this.unfilteredTrips.length) return

      console.log('update filter!', this.unfilteredTrips.length)
      this.isFiltering = true

      // this.myState.statusMessage = '...filtering data...'

      const selectedPaths = [] as any[]

      // GET FULL PATHS FOR SELECTED (but unfiltered) TRIPS
      const numUnfilteredTrips = this.unfilteredTrips.length
      console.log('UNFILTERED trips', numUnfilteredTrips)

      if (numUnfilteredTrips == 0) {
        // NO NEW TRIPS
        this.numTrips = -1
        this.isFiltering = false
        return
      }

      // build filters
      let filters = ''
      if (this.dayOfWeek[8]) filters += '&is_weekday=true'
      if (this.dayOfWeek[9]) filters += '&is_weekday=false'
      if (this.timeOfDay[1]) filters += '&start_time=08'
      if (this.timeOfDay[2]) filters += '&start_time=13'
      if (this.timeOfDay[3]) filters += '&start_time=17'
      if (this.vehType[1]) filters += '&veh_type=car'
      if (this.vehType[2]) filters += '&veh_type=HCV'
      console.log(111, filters)

      // only fetch 800 at a time due to URL length limits
      const chunk = 807

      let i = 0
      let numFilteredTrips = 0

      while (i < numUnfilteredTrips) {
        console.log(i)
        const tripIDs = this.unfilteredTrips.slice(i, i + chunk).join(',')
        const pathUrl = `${this.vizDetails.server}/path?trip=${tripIDs}${filters}`
        console.log('path length:', pathUrl.length)
        let paths = [] as any[]

        try {
          this.myState.statusMessage = ''
          paths = await fetch(pathUrl, {
            headers: { Authorization: this.apiKey, 'Access-Control-Allow-Origin': '*' },
          }).then(response => response.json())
        } catch (e) {
          this.myState.statusMessage = 'Error fetching paths :-('
          this.isFiltering = false
          return
        }

        for (const trip of paths) {
          const snappedPath = trip.Path1
          const coords = snappedPath
            .split(',')
            .map((point: string) => point.split(' ').map(p => parseFloat(p)))

          const speeds = trip.Speed_path.split(',').map((speed: any) => parseFloat(speed))
          const timestamps = trip.Timestamp_path.split(',').map((date: string) =>
            date.substring(11, 19)
          )

          selectedPaths.push({ path: coords, speeds, startTime: trip.start_time, timestamps })
        }

        this.selectedPaths = [...selectedPaths]
        await this.$nextTick()

        i += chunk
        numFilteredTrips += paths.length
        this.numTrips = numFilteredTrips
      }
      this.isFiltering = false
      this.runStatistics()
    },

    /** Try multiple times to fetch, as server might be asleep */
    async fetchTripsAtLocation(url: string) {
      console.log('fetchTrips', this.serverRetries)
      const trips = (await fetch(url, {
        headers: { Authorization: this.apiKey, 'Access-Control-Allow-Origin': '*' },
      }).then(async response => {
        if (response.status == 200) {
          this.serverRetries = 0
          return response.json()
        }
        if (response.status == 403) {
          // try again
          this.serverRetries += 1
          this.forceApiAuthorization()
          return await this.fetchTripsAtLocation(url)
        } else if (this.serverRetries < 5) {
          // wait 2 seconds and retry
          this.serverRetries += 1
          this.myState.statusMessage = `Contacting server... (${this.serverRetries})`
          await new Promise(r => setTimeout(r, 2000))
          return await this.fetchTripsAtLocation(url)
        }
        throw Error('API ERROR: ' + response.statusText)
      })) as any[]

      return trips
    },

    async clickedCoordinate(coord: number[]) {
      if (this.numIntersectionsSelected == 0) this.startCoord = coord
      if (this.numIntersectionsSelected == 1) this.endCoord = coord
      this.numIntersectionsSelected++

      if (this.numIntersectionsSelected == 3) {
        this.clearMap()
        this.speedData = []
        this.boxplot = []
        this.avgSpeed = 0
      }

      // all done if we do not have BOTH start and end selected
      if (this.numIntersectionsSelected !== 2) return

      const server = this.vizDetails.server

      // JSON response will go here:
      let startTrips = [] as any[]
      let endTrips = [] as any[]

      try {
        this.myState.statusMessage = ''
        // GET START TRIP LIST
        const [lon, lat] = this.startCoord
        console.log({ lon, lat })
        let url = `${server}/location?lon=${lon}&lat=${lat}&radius=0.0002`
        console.log(url)

        startTrips = await this.fetchTripsAtLocation(url)
        if (!startTrips.length) {
          this.selectedPaths = []
          this.numTrips = -1
          return
        }

        // GET END TRIP LIST
        const [lon2, lat2] = this.endCoord
        console.log({ lon2, lat2 })
        url = `${server}/location?lon=${lon2}&lat=${lat2}&radius=0.0002`
        console.log(url)

        endTrips = await this.fetchTripsAtLocation(url)
        if (!endTrips.length) {
          this.selectedPaths = []
          this.numTrips = -1
          return
        }
      } catch (e) {
        const err = e as any
        console.error({ err })
        this.myState.statusMessage = err.message || 'Error fetching paths :-('
      }

      // FIGURE OUT UNION
      const startT = startTrips.map((t: any) => t.TripID)
      const endT = endTrips.map((t: any) => t.TripID)
      // console.log({ startT, endT })

      const union = []
      for (let TT of startT) {
        if (endT.includes(TT)) union.push(TT)
      }

      this.unfilteredTrips = union

      this.updateFilter()
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

    getApiAuthorization() {
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

    this.setupLogoMover()

    this.getApiAuthorization()
    this.wakeUpServer()
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
  padding: 0rem 1rem;
  color: #eee;
  // border-left: 1px solid #557;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.info-panel {
  position: absolute;
  bottom: 4rem;
  left: 5rem;
  right: 5rem;
  pointer-events: auto;
  background-color: #3040b090;
  padding: 0.5rem 1rem;
  z-index: 5;
  border-radius: 8px;
  font-weight: bold;
  font-size: 18px;
  border: 1px solid #bbb;
  text-align: center;
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
  margin-top: 1rem;
  // flex: 1;
}

.reliability {
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.stats-plot {
  margin-bottom: 1rem;
  border: 1px solid #555;
  flex: 1;
}

h2 {
  line-height: 2.2rem;
  margin-bottom: 1rem;
}

.button-section {
  margin-top: 0.25rem;
}

.flex1 {
  margin-right: 1px;
}

.auth-panel {
  position: absolute;
  top: 2rem;
  left: 0;
  right: 0;
  width: 20rem;
  margin: 0 auto;
  z-index: 10;
}

.is-filtering {
  opacity: 0.75;
}
</style>
./DeckLayers
