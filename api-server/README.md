# iMOVE API SERVER

This is a Python server running NGINX and Gunicorn. It queries the iMOVE parquet dataset using PySpark.

Originally this server was running on Amazon AWS but that was slow and expensive! So this version
is using https://fly.io to see if performance is better.

- Uses Python 3.x and gunicorn as the REST API server
- PySpark for querying the parquet files
- NGINX reverse proxy in front of it
- All running inside a single docker container using supervisord
- Fly.io has a "scale to zero" architecture so the server goes to sleep when
  there are zero connections. This saves a ton of money because it's a 16GB 8x CPU server.
- The volume storage has a continuous cost regardless of server up/down status; but it's not high.

## Fly.io implementation notes

- config is stored in `fly.toml`
- Fly "machine" is `shared-cpu-8x` machine with 16GB ram, in SYD region.
- autostart/autostop scales to zero; must ping server with http(s) to wake it up. Takes a few seconds
- Fly "Volume" is data attached storage -- currently 16GB but, if successful, will eventually
  hold the entire dataset. Mounted at `/data`
- **Note** file `auth-keys.csv` contains API credentials and is **not stored in Git**. This CSV file
  must be present and has form `username,apikey`. Currently we just have one user 'imove'
- The `fly deploy` command copies this file into the server instance so that it can validate requests.
- Alternatively, use `fly secrets add API_KEYS="key1,key2,key3" to set keys without writing that file.
  (Currently not used but possible)

**Fly commands**

- `fly launch` - go thru the launch wizard and choose region, size, etc
- `fly deploy` - update the deploy, it rereads fly.toml and rebuilds all the docker components
- ~~`fly shell sftp` - use to push files to data fol~~
- use python package `magic-wormhole` to transfer files and entire directories to fly volumes.
  - Logging in via ssh first: `fly ssh console`
  - `pip install magic-wormhole`
  - `wormhole receive` and then on local machine, run `wormhole send`

## Docker container - Alpine Linux notes

Alpine Linux is small but missing lots of stuff we need! So the Dockerfile installs all those packages.

- Dockerfile is in https://github.com/billyc/imove-australia-simwrapper/blob/master/api-server/Dockerfile

Apt packages needed:

- bash (!), python3, py3-pip, openjdk17, libc6-compat snappy java-snappy-native, supervisor
- This copypasta from StackOverflow fixes the required snappy compression library: https://stackoverflow.com/questions/50288034/unsatisfiedlinkerror-tmp-snappy-1-1-4-libsnappyjava-so-error-loading-shared-li
- `ln -s /lib/libc.musl-x86_64.so.1 /lib/ld-linux-x86-64.so.2`

## iMove Australia webapp notes

- Static site, can be hosted anywhere, but currently on GitHub Pages. Fast and free.
- Need to update code to wake api server up on first launch, and to reestablish connection
  as necessary. Fly will put it to sleep after just a couple minutes of inactivity. Which is good for $$$
