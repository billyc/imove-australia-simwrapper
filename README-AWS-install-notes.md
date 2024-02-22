# AWS Notes

This documents the steps in setting up the AWS EC2/S3 based website for the iMOVE Australia
project. Currently that site is just barely operational and is quite slow -- so these
instructions will need some updating...

Basic Setup:

- ssh into server using SSH pem file
- `sudo su` because everything requires root
- `apt update`
- `apt upgrade`

Install NGINX:

- Uploaded all data files to S3 Bucket.
- Created EC2 t2.xlarge (16GB RAM) Ubuntu image
- Add "Elastic IP" - Allocate New Address
- `apt install nginx`
- `apt install ufw`
- `ufw allow http`
- `ufw allow https`
- `ufw allow ssh`
- Added HTTP to Instance "Security Group"
- `service nginx start`
- Note the DNS name and try browsing to it with http:
- "Welcome to NGINX!"

Mount S3 Bucket:

- Need "AWS Access Key ID" and "Secret Access Key" from admin
  - ACCESS KEY: xxxx
  - SECRET KEY: xxxx
- `apt install s3fs`
- `mkdir /mnt/s3`
- `echo "ACCESS:SECRET" > /root/.passwd-s3fs`
- `chmod 600 /root/.passwd-s3fs`
- Now mount bucket "imove-australia-reliability-data"
  - `s3fs imove-australia-reliability-data /mnt/s3 -o passwd_file=/root/.passwd-s3fs -o url=https://s3.amazonaws.com`
- Make it automount:
  - edit /etc/fuse.conf: uncomment `#user_allow_other`
  - `echo "s3fs#imove-australia-reliability-data /mnt/s3 fuse _netdev,allow_other 0 0" >> /etc/fstab`
- Now you should have all the data files mounted and available in `/mnt/s3`

Add Basic Auth to NGINX:

- `apt install apache2-utils`
- `htpasswd -c /etc/nginx .htpasswd imove`
  - pw: xxxxx
- `chown www-data.www-data /etc/nginx/.htpasswd`
- `chmod 600 /etc/nginx/.htpasswd`
- add to /etc/nginx/sites-enabled/default:
  - `auth_basic "iMOVE Australia";`
  - `auth_basic_user_file /etc/nginx/.htpasswd;`

Add Reverse Proxy for Python API:

- /etc/nginx/sites-enabled/default
```
location /api {
      proxy_pass http://localhost:5000;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Install Python3/PIP/Java:

- `apt install python3-pip`
- `pip3 install flask flask_cors pyspark pandas setuptools pyarrow`
- `apt install default-jre default-jdk`
- edit /etc/bash.bashrc:
  - `export JAVA_HOME=/usr/lib/jvm/default_java`
- Copy spark-query.py
  - `scp -i "imove-key.pem" spark-query.java ubuntu:ec2-ip-address-value:`


TODO: auto-start python3 spark-query.py

- to be added


