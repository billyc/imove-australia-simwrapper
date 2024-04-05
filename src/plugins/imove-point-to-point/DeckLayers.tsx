import React, { useState, useMemo, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { COORDINATE_SYSTEM } from '@deck.gl/core'
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'

import { OFFSET_DIRECTION } from '@/layers/LineOffsetLayer'
import PathOffsetLayer from '@/layers/PathOffsetLayer'

import { StaticMap } from 'react-map-gl'

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
  dark = false,
  mapIsIndependent = false,
  click = {} as any,
  paths = [] as any,
  startCoord = [] as number[],
  endCoord = [] as number[],
}) {
  // ------- draw frame begins here -----------------------------

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

  function getTooltip({ object, index }: { object: any; index: number }) {
    return null
  }

  const coordinateSystem = COORDINATE_SYSTEM.DEFAULT

  const points = []
  if (startCoord.length) points.push({ coord: startCoord, color: [255, 64, 128] })
  if (endCoord.length) points.push({ coord: endCoord, color: [255, 64, 128] }) // [32, 238, 128] })

  //@ts-ignore
  const pointLayer = new ScatterplotLayer({
    id: 'point-layer',
    data: points,
    radiusScale: 1.0,
    radiusMinPixels: 12,
    getPosition: (d: any) => d.coord,
    getFillColor: (d: any) => d.color,
    getRadius: 12,
    opacity: 0.7,
    radiusUnits: 'meters',
  })

  const labelLayer = new TextLayer({
    id: 'label-layer',
    data: [
      { text: 'A', coordinates: startCoord },
      { text: 'B', coordinates: endCoord },
    ],
    getText: (d: any) => d.text,
    getPosition: (d: any) => d.coordinates,
    getColor: [255, 255, 255],
    getSize: 20,
    billboard: false,
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
  })

  //@ts-ignore
  const pathLayer = new PathOffsetLayer({
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
      layers={[pathLayer, pointLayer, labelLayer]}
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
