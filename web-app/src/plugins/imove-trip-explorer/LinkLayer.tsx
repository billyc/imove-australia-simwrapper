import React, { useState, useMemo, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { COORDINATE_SYSTEM } from '@deck.gl/core'

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
  dark = false,
  projection = '',
  scaleWidth = 1,
  mapIsIndependent = false,
  click = {} as any,
  paths = [] as any,
}) {
  // ------- draw frame begins here -----------------------------

  const widthDivisor = scaleWidth ? 1 / scaleWidth : 0

  const [viewState, setViewState] = useState(globalStore.state.viewState)

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
    return null
  }

  function getTooltip({ object, index }: { object: any; index: number }) {
    // tooltip will show values for color settings and for width settings.
    // if there is base data, it will also show values and diff vs. base for both color and width.
    return null
  }

  // Atlantis is pre-converted now in the RoadNetworkLoader to lng/lat
  // projection == 'Atlantis' ? COORDINATE_SYSTEM.METER_OFFSETS : COORDINATE_SYSTEM.DEFAULT
  const coordinateSystem = COORDINATE_SYSTEM.DEFAULT

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
      layers={[layer]}
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
