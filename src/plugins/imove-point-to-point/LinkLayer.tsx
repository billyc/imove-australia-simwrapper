import React, { useState, useMemo, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { COORDINATE_SYSTEM } from '@deck.gl/core'
import { ScatterplotLayer } from '@deck.gl/layers'

import { OFFSET_DIRECTION } from '@/layers/LineOffsetLayer'
import PathOffsetLayer from '@/layers/PathOffsetLayer'

import { StaticMap } from 'react-map-gl'
import { format } from 'mathjs'

import {
  MAPBOX_TOKEN,
  REACT_VIEW_HANDLES,
  DataTableColumn,
  LookupDataset,
  DataType,
} from '@/Globals'
import globalStore from '@/store'

export default function Component({
  viewId = 0,
  links = { source: new Float32Array(), dest: new Float32Array() },
  colorRampType = -1, // -1 undefined, 0 categorical, 1 diffs, 2 sequential
  build = {} as LookupDataset,
  base = {} as LookupDataset,
  widths = {} as LookupDataset,
  widthsBase = {} as LookupDataset,
  newColors = new Uint8Array(),
  newWidths = new Float32Array(),
  dark = false,
  projection = '',
  scaleWidth = 1,
  mapIsIndependent = false,
  click = {} as any,
  paths = [] as any,
  startCoord = [] as number[],
  endCoord = [] as number[],
}) {
  // ------- draw frame begins here -----------------------------

  const widthDivisor = scaleWidth ? 1 / scaleWidth : 0

  const [viewState, setViewState] = useState(globalStore.state.viewState)

  const buildColumn = build.dataTable[build.activeColumn]
  const baseColumn = base.dataTable[base.activeColumn]
  const widthColumn = widths.dataTable[widths.activeColumn]

  const isCategorical = colorRampType === 0 || buildColumn?.type == DataType.STRING

  // register setViewState in global view updater so we can respond to external map motion
  REACT_VIEW_HANDLES[viewId] = (view: any) => {
    if (view) {
      setViewState(view)
    } else {
      setViewState(globalStore.state.viewState)
    }
  }

  function handleClick(event: any) {
    console.log('click!', event)
    if (event.coordinate) {
      console.log(event.coordinate)
      click({ coordinate: event.coordinate })
    }
  }

  function handleViewState(view: any) {
    setViewState(view)
    view.center = [view.longitude, view.latitude]

    if (!mapIsIndependent) globalStore.commit('setMapCamera', view)
  }

  function precise(x: number) {
    return format(x, { lowerExp: -6, upperExp: 6, precision: 5 })
  }

  function buildTooltipHtml(
    columnBuild: DataTableColumn,
    columnBase: DataTableColumn,
    geoOffset: number
  ) {
    try {
      if (!columnBuild) return null

      const index = build.csvRowFromLinkRow[geoOffset]
      let value = columnBuild.values[index]

      if (isCategorical) {
        if (!Number.isFinite(value)) return null
        return `<b>${columnBuild.name}</b><p>${precise(value)}</p>`
      }

      let html = null

      if (Number.isFinite(value)) html = `<b>${columnBuild.name}</b><p>Value: ${precise(value)}</p>`

      const baseIndex = base?.csvRowFromLinkRow[geoOffset]
      if (baseIndex) {
        let baseValue = base ? base.dataTable[columnBase.name].values[baseIndex] : null
        let diff = value - baseValue
        if (Number.isFinite(baseValue)) {
          html += `<p>Base: ${precise(baseValue)}</p>`
          html += `<p>+/- Base: ${precise(diff)}</p>`
        }
      }

      return html
    } catch (e) {
      return null
    }
  }

  function getTooltip({ object, index }: { object: any; index: number }) {
    // tooltip will show values for color settings and for width settings.
    // if there is base data, it will also show values and diff vs. base for both color and width.

    try {
      // tooltip color values ------------
      let tooltip = buildTooltipHtml(buildColumn, baseColumn, index)

      // tooltip widths------------
      if (widthColumn && widthColumn.name !== buildColumn.name) {
        const widthTip = buildTooltipHtml(
          widthColumn,
          widthsBase.dataTable[widthsBase.activeColumn],
          index
        )
        if (widthTip) tooltip = tooltip ? tooltip + widthTip : widthTip
      }

      if (!tooltip) return null

      return {
        html: tooltip,
        style: { color: dark ? '#ccc' : '#223', backgroundColor: dark ? '#2a3c4f' : 'white' },
      }
    } catch (e) {
      console.warn(e)
      return null
    }
  }

  // Atlantis is pre-converted now in the RoadNetworkLoader to lng/lat
  // projection == 'Atlantis' ? COORDINATE_SYSTEM.METER_OFFSETS : COORDINATE_SYSTEM.DEFAULT
  const coordinateSystem = COORDINATE_SYSTEM.DEFAULT

  const points = []
  if (startCoord.length) points.push({ coord: startCoord, color: [255, 64, 128] })
  if (endCoord.length) points.push({ coord: endCoord, color: [255, 64, 128] }) // [32, 238, 128] })

  //@ts-ignore
  const pointLayer = new ScatterplotLayer({
    id: 'point-layer',
    data: points,
    radiusScale: 1.0,
    radiusMinPixels: 15,
    getPosition: (d: any) => d.coord,
    getFillColor: (d: any) => d.color,
    getRadius: 1,
    opacity: 0.5,
  })

  //@ts-ignore
  const layer = new PathOffsetLayer({
    id: 'pathLayer',
    data: paths,
    getPath: (d: any) => d.path,
    getColor: [0, 200, 128],
    getWidth: 3,
    widthUnits: 'pixels',
    widthScale: 1, // widthDivisor,
    widthMinPixels: 0.5,
    widthMaxPixels: 50,
    pickable: true,
    coordinateSystem,
    opacity: 0.35,
    autoHighlight: true,
    highlightColor: [255, 0, 224],
    offsetDirection: OFFSET_DIRECTION.LEFT,
    // updateTriggers: {
    //   getPath: [links.source],
    //   getTargetPosition: [links.dest],
    //   getColor: [newColors, dark],
    //   getWidth: [newWidths],
    // },
    transitions: {
      getColor: 250,
      getWidth: 250,
      getPath: 0,
      widthScale: 250,
    },
    parameters: {
      depthTest: false,
    },
  })

  const showBackgroundMap = true // projection && projection !== 'Atlantis'

  return (
    /*
    //@ts-ignore */
    <DeckGL
      layers={[layer, pointLayer]}
      viewState={viewState}
      controller={true}
      pickingRadius={5}
      getTooltip={getTooltip}
      getCursor={({ isDragging, isHovering }: any) =>
        isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
      }
      onClick={handleClick}
      onViewStateChange={(e: any) => handleViewState(e.viewState)}
    >
      {showBackgroundMap && (
        /*
        // @ts-ignore */
        <StaticMap mapStyle={globalStore.getters.mapStyle} mapboxApiAccessToken={MAPBOX_TOKEN} />
      )}
    </DeckGL>
  )
}
