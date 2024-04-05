#!/usr/bin/env python3

# RunServer.py #######################################################
# This is the SimWrapper Runner API.
#
# It does one thing: it is a REST API application which can run in the
# cloud somewhere and accepts job requests and file uploads from
# SimWrapper users.
#
# Separately, the cluster-daemon program will occasionally poll this service
# to see if any new jobs have been submitted, and that cluster daemon
# will fetch the files and try to launch the job on the compute resource.

import os,sys,tempfile,random,shutil
from os.path import exists

import sqlite3
from sqlite3 import Error
from hashlib import sha1

from flask import Flask, request, send_file
from flask_cors import CORS
from flask_restful import Resource, Api, reqparse
from flask_uploads import UploadSet, configure_uploads, ALL

# Storage volume expected to be mounted on /data:
blobfolder = '/data/'
database = '/data/database.sqlite3'

# Set up API keys
authfile = 'auth-keys.csv'  # username,key
valid_api_keys = {}


def setup_auth_keys(authfile):
    lookup = {}
    # keys from API_KEYS env variable
    if 'API_KEYS' in os.environ:
        env_api_keys = [key.strip() for key in os.environ['API_KEYS'].split(',')]
        for key in env_api_keys:
            split = key.split('-')
            lookup[key] = len(split) > 1 and split[0] or 'user'

    # keys from auth_keys.csv
    with open(authfile,'r') as keys:
        for line in keys:
            line = line.strip()
            if line.startswith('#'): continue
            items = line.split(',')
            if len(items) >= 2: lookup[items[1]] = items[0]

    # No keys? Abort
    if len(lookup.keys()) == 0:
        raise Error("No valid API keys")
        sys.exit(1)

    print("\n*** SIMWRAPPER RUNSERVER")
    print("*** Valid API users:", ", ".join(lookup.values()), '\n')
    return lookup

### SQL HELPERS ------------------------------------------------------------
JOB_COLUMNS = ['id','owner','status','folder','project', 'start','script', 'qsub_id', 'cRAM', 'cProcessors', 'cEmail']
FILE_COLUMNS = ['id', 'name', 'hash','file_type', 'size_of', 'modified_date', 'job_id']
# JOB_STATUS = ['Not started', 'Submitted', 'Preparing', 'Queued', 'Launched', 'Complete', 'Cancelled', 'Error']


def sql_create_connection(filename):
    """ create a database connection to a database
    """
    conn = None;
    try:
        conn = sqlite3.connect(filename)
        return conn
    except Error as e:
        print(e)
    return conn


def sql_create_table(conn, create_table_sql):
    """ create a table from the create_table_sql statement
    :param conn: Connection object
    :param create_table_sql: a CREATE TABLE statement
    :return:
    """
    try:
        c = conn.cursor()
        c.execute(create_table_sql)
    except Error as e:
        print(e)


def sql_create_clean_database(database):

    sql_create_jobs_table = """CREATE TABLE IF NOT EXISTS jobs (
                                        id INTEGER PRIMARY KEY,
                                        owner TEXT,
                                        status INTEGER,
                                        folder TEXT,
                                        project TEXT,
                                        start TEXT,
                                        script TEXT,
                                        qsub_id TEXT,
                                        cRAM TEXT,
                                        cProcessors TEXT,
                                        cEmail TEXT
                            ); """

    sql_create_files_table = """CREATE TABLE IF NOT EXISTS files (
                                    id INTEGER PRIMARY KEY,
                                    name TEXT NOT NULL,
                                    hash TEXT NOT NULL,
                                    file_type TEXT,
                                    size_of INTEGER,
                                    modified_date TEXT,
                                    job_id INTEGER NOT NULL,
                                    FOREIGN KEY (job_id) REFERENCES jobs(id)
                                );"""

    conn = sql_create_connection(database)

    if conn is not None:
        sql_create_table(conn, sql_create_jobs_table)
        sql_create_table(conn, sql_create_files_table)
    else:
        print('cannot create database connection')


def sql_select_jobs(queryTerms):
    conn = sql_create_connection(database)
    with conn:
        if 'running' in queryTerms.keys():
          sql = "SELECT * FROM jobs WHERE status=3 OR status=4"
        else:
          terms = [f"{x}=:{x}" for x in queryTerms.keys()]
          joined = "AND ".join(terms)
          # No injection please
          if (joined.find(';') > -1): return []
          sql = "SELECT * FROM jobs "
          if len(terms) > 0: sql += "WHERE " + joined

        cur = conn.cursor()
        cur.execute(sql, queryTerms)
        rows = cur.fetchall()

        answerDict = []
        for row in rows:
            json = dict(map(lambda i,j : (i,j), JOB_COLUMNS, row))
            # print(json)
            answerDict.append(json)
        return answerDict
    return []


def sql_insert_job(queryDict):
    conn = sql_create_connection(database)
    with conn:
        # generate keys/values from dict
        columns = ', '.join(queryDict.keys())
        placeholders = ':'+', :'.join(queryDict.keys())
        sql = 'INSERT INTO jobs(%s) VALUES(%s)' % (columns, placeholders)

        cur = conn.cursor()
        cur.execute(sql, queryDict)
        conn.commit()

        # print(cur.lastrowid)
        return cur.lastrowid


def sql_update_job(job_id, queryDict):
    conn = sql_create_connection(database)
    with conn:
        # generate keys/values from dict
        vars = [f"{x}=:{x}" for x in queryDict.keys()]
        joined = ", ".join(vars)
        sql = 'UPDATE jobs SET ' + joined + ' WHERE id = ' + job_id

        # print(sql)

        cur = conn.cursor()
        cur.execute(sql, queryDict)
        conn.commit()

        # print(cur.lastrowid)
        return cur.lastrowid
    return "nope", 500


def sql_insert_file(queryDict):
    conn = sql_create_connection(database)
    with conn:
        # generate keys/values from dict
        columns = ', '.join(queryDict.keys())
        placeholders = ':'+', :'.join(queryDict.keys())

        sql = 'INSERT INTO files (%s) VALUES (%s)' % (columns, placeholders)
        cur = conn.cursor()
        cur.execute(sql, queryDict)
        conn.commit()
        # print(cur.lastrowid)
        return cur.lastrowid

    return "Could not add file", 500


def sql_select_files(queryTerms):
    conn = sql_create_connection(database)
    with conn:
        terms = [f"{x}=:{x}" for x in queryTerms.keys()]
        joined = "AND ".join(terms)
        # No injection please
        if (joined.find(';') > -1): return []
        sql = "SELECT * FROM files "
        if len(terms) > 0: sql += "WHERE " + joined
        cur = conn.cursor()
        cur.execute(sql, queryTerms)
        rows = cur.fetchall()

        answerDict = []
        for row in rows:
            json = dict(map(lambda i,j : (i,j), FILE_COLUMNS, row))
            # print(json)
            answerDict.append(json)
        return answerDict
    return []


def sql_select_files_by_hash(hash):
    conn = sql_create_connection(database)
    with conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM files")
        rows = cur.fetchall()
        answerDict = []
        for row in rows:
            json = dict(map(lambda i,j : (i,j), FILE_COLUMNS, row))
            # print(json)
            answerDict.append(json)
        return answerDict

### END SQL HELPERS ------------------------------------------------------------

def getHash(filename):
    BUF_SIZE = 65536
    sha = sha1()
    with open(filename, 'rb') as f:
        while True:
            data = f.read(BUF_SIZE)
            if not data:
                break
            sha.update(data)
        sha.update(data)
    return sha.hexdigest()


def is_valid_api_key():
    apikey = request.headers.get('Authorization')
    if apikey in valid_api_keys: return True
    return False


class FilesList(Resource):
    def get(self):
        if not is_valid_api_key(): return "Invalid API Key", 403
        return sql_select_files(request.args)

    def post(self):
        if not is_valid_api_key(): return "Invalid API Key", 403

        print("### FILES", request.files)
        print("### FORM", request.form)

        if not "file" in request.files:
            try:
                files_parser = reqparse.RequestParser()
                for column in FILE_COLUMNS:
                    files_parser.add_argument(column)
                params = files_parser.parse_args()

                result = sql_insert_file(params)
                return result, 201 # created
            except Error as e:
                print(e)

        if "file" in request.files:
            myFile = request.files["file"]
            if myFile:
                try:
                    user_filename = '' + myFile.filename
                    tmpFile = "temp{}".format(random.randint(0,1e12))
                    myFile.filename = tmpFile
                    filename = files.save(myFile)
                    tmpFullPath = os.path.join(blobfolder, tmpFile)
                    fileSize = os.path.getsize(tmpFullPath)
                    hashx = getHash(tmpFullPath)
                    os.rename(tmpFullPath, os.path.join(blobfolder,hashx))
                    insertedRow = sql_insert_file({
                        "name": user_filename,
                        "hash": hashx,
                        "size_of": fileSize,
                        "job_id": request.form.get("job_id")
                    })
                    return insertedRow, 201
                except Error as e:
                    print(e)


        return "Failed, file not uploaded", 500


class JobsList(Resource):
    def get(self):
        if not is_valid_api_key(): return "Invalid API Key", 403

        conn = sql_create_connection(database)
        with conn:
            active_jobs = sql_select_jobs(request.args) # active
            return active_jobs


    def post(self):
        """ Create new empty unstarted job"""
        if not is_valid_api_key(): return "Invalid API Key", 403

        job_parser = reqparse.RequestParser()
        for column in JOB_COLUMNS:
            job_parser.add_argument(column)
        job = job_parser.parse_args()
        job["status"] = 0

        # map the username
        apikey = request.headers.get('Authorization')
        username = valid_api_keys[apikey]
        if username: job["owner"] = username

        print(12345, job)
        result = sql_insert_job(job)
        return result, 201 # created


class Job(Resource):
    # def get(self, job_id):
    #     if not is_valid_api_key(): return "Invalid API Key", 403
    #     if student_id not in STUDENTS:
    #         return "Not found", 404
    #     else:
    #         return STUDENTS[student_id]

    def put(self, job_id):
        """ Update job - change status etc
        """
        if not is_valid_api_key(): return "Invalid API Key", 403
        if not job_id.isnumeric(): return "Invalid ID", 403

        job_parser = reqparse.RequestParser()
        for column in JOB_COLUMNS:
            job_parser.add_argument(column)
        args = job_parser.parse_args()

        # fetch existing copy
        job = sql_select_jobs({"id": job_id})
        if len(job) != 1: return "Invalid ID", 404
        job = job[0]

        for column in JOB_COLUMNS:
            args[column] = args[column] if args[column] is not None else job[column]

        result = sql_update_job(job_id, args)
        return result, 200


class File(Resource):
    def get(self, file_id):
        if not is_valid_api_key(): return "Invalid API Key", 403

        query = {"id": file_id}
        file_records = sql_select_files(query)
        if len(file_records) != 1: return "File not found", 404

        requested_file = file_records[0]
        hash = requested_file["hash"]
        # print(hash)

        return send_file(blobfolder + hash, download_name=requested_file["name"])

    # TODO will we need rename?
    # def put(self, job_id):
    #     """ Update job - change status etc
    #     """
    #     if not is_valid_api_key(): return "Invalid API Key", 403
    #     if not job_id.isnumeric(): return "Invaoid ID", 403

    #     parser.add_argument("status")
    #     args = parser.parse_args()

    #     if args["status"] is not None:
    #         result = sql_update_job(job_id, args)
    #         return result, 200

    #     return "no status in request", 500


# ---------- Set up Flask ---------

if not exists(database): sql_create_clean_database(database)

valid_api_keys = setup_auth_keys(authfile)

app = Flask(__name__)
CORS(app)
# app.config['CORS_HEADERS'] = 'Content-Type'

api = Api(app)

# Set up Flask Uploads ----------------------------------------------
app.config['MAX_CONTENT_LENGTH'] = 125 * 1024 * 1024 # 125 max file size
app.config["UPLOADED_FILES_DEST"] = blobfolder
files = UploadSet("files", ALL)
configure_uploads(app, files)

api.add_resource(FilesList, '/files/')
api.add_resource(File, '/files/<file_id>')
api.add_resource(JobsList, '/jobs/')
api.add_resource(Job, '/jobs/<job_id>')

def main():
    sql_create_clean_database(database)
    app.run(port=4999, debug=True)

if __name__ == "__main__":
    main()
