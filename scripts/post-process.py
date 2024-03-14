from datetime import datetime
import csv
import math
import ndjson
import pandas as pd
import pyarrow

parquet_file = '000000000000'

output_file = "trips.json"
output_od = "trips_od.csv"

f_od = open(output_od, 'w')
od_writer = csv.writer(f_od, delimiter=",")
od_writer.writerow(['start_lon','start_lat','end_lon','end_lat'])

# Complete path
file_path = './compassiot-sample/' \
    + 'support.MelbourneUni_initial_report-39d90ea06639c0682e7b312e-' \
    + parquet_file \
    + '.parquet'

# trips: [ time[], path[][], passengers[], vendor ]
trips = []
requests = []

def process_trip(row):
    path = row['Path1'].split(',')
    times = row['Timestamp_path'].split(',')
    vehID = row['VehicleID']
    vehtype = row['veh_types']

    p_start = [float(p) for p in row['first_point'][6:-1].split(' ')]
    p_start.extend([float(p) for p in row['last_point'][6:-1].split(' ')])

    od_writer.writerow(p_start)

    print(len(times), 'timepoints')

    trip = {"timestamps" : [], "path": [], "passengers": [], "vendor": 0 }

    # loop over each point/time
    for i in range(len(times)):
        # trim decimal points on coordinates
        longlat = [math.floor(1e6*float(z))/1e6 for z in path[i].split(' ')]

        timestamp = times[i]
        dt = datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')

        seconds = 3600*dt.hour + 60*dt.minute + dt.second

        # For now, let's ignore the date
        trip['timestamps'].append(seconds)
        trip['path'].append(longlat)
        trip['passengers'].append(vehtype == 'car' and 1 or 3)

    xrequest = [trip['timestamps'][0]]
    xrequest.extend(p_start)
    xrequest.append(1)
    xrequest.append(trip['timestamps'][-1])
    requests.append(xrequest)

    trips.append(trip)
# ---------------------------------------

df = pd.read_parquet(file_path)
df.apply(process_trip, axis=1)

# Sort by start time
trips = sorted( trips, key=lambda k: k['timestamps'][0] )

# write it out
print("Writing:", output_file)
with open(output_file, "w") as f:
    f.writelines('{"trips": [\n')
    writer = ndjson.writer(f, separators=(",", ":"))

    maxtrips = len(trips)

    i = 0
    for trip in trips:
        i += 1
        writer.writerow(trip)
        if i < maxtrips:
            f.writelines(",")

    f.writelines("],\n")
    f.writelines('"drtRequests": []')
    f.writelines("\n}\n")

f_od.close()

print(len(trips), "vehicle paths written.")
