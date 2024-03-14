# try accessing parquet files using Spark
# source venv/bin/activate

import setuptools
import pandas as pd
import json, sys
import numpy as np
from rtree import index
from shapely.geometry import shape, Point
from flask import Flask, request, jsonify
from pyspark.conf import SparkConf
from pyspark.sql import SparkSession
from pyspark.sql.functions import to_json, udf
from pyspark.sql.types import StringType
from datetime import datetime, timedelta


# ------------------
# Set up Spark
# spark = SparkSession.builder.getOrCreate()
spark = (
   SparkSession.builder.appName("CompassIoT")
   .config("spark.sql.repl.eagerEval.enabled", True)
   .config("spark.sql.parquet.cacheMetadata", "true")
   .config("spark.executor.memory", "8g")
   .config("spark.driver.memory", "8g")
   .config("spark.sql.session.timeZone", "Etc/UTC")
   .getOrCreate()
)

# initialize spark dataframe
folder = './sample-data/computed'
# folder = './parquet-data/computed'

# df = spark.read.option('mergeSchema','true').parquet(folder)
df = spark.read.parquet(folder)
df.printSchema()


# load GEOJSON
with open(sys.argv[1]) as f:
  geojson = json.load(f)

# Populate the index with polygons' bounding boxes
feature_offset = {}
idx = index.Index()
for i, feature in enumerate(geojson['features']):
    feature_offset[feature['properties']['SA2_CODE21']] = i
    if feature['geometry']['type'] == 'Polygon':
        print(i,feature['geometry']['type'])
        polygon = shape(feature['geometry'])
        idx.insert(i, polygon.bounds)
        continue
    if feature['geometry']['type'] == 'MultiPolygon':
        print(i,feature['geometry']['type'])
        multipolygon = shape(feature['geometry'])
        print('multipolygon geom', multipolygon.bounds)
        try:
            idx.insert(i, multipolygon.bounds)
        except:
            print('fail', multipolygon)
            continue
            # oh well


# summary matrix
num_features = len(geojson['features'])
print(num_features)
odmatrix = np.zeros((num_features, num_features))


def find_od(row):
    o_coords = (row['start_lon'], row['start_lat'])
    print(o_coords)
    otaz = get_polygon(Point(o_coords))
    d_coords = (row['end_lon'], row['end_lat'])
    print(d_coords)
    dtaz = get_polygon(Point(d_coords))

    if (otaz == None or dtaz == None):
        return

    print(feature_offset[otaz],feature_offset[dtaz])

def get_polygon(point):

    # Query the index to find potential candidate polygons
    potential_polygons = [geojson['features'][i] for i in idx.intersection(point.coords[0])]

    # Scan the potential polygons for a hit
    for feature in potential_polygons:
        try:
            polygon = shape(feature['geometry'])
            if polygon.contains(point):
                return feature['properties']['SA2_CODE21']
        except:
            continue
    else:
        print("Point is not inside any polygon.")
        return None


# Loop on all records and determine O/D
df.foreach(find_od)
