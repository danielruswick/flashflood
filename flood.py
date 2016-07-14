import os
import subprocess
from flask import *
import time
import json
from threading import Thread


class FlashFlooder():
    CAPTURE_DIR = '/var/captures'
    CAPTURE_FILE = '/var/captures/{0}'
    EXTRACTED_DIR = './extracted_erfs'
    EXTRACTED_FILE = './extracted_erfs/data_{0}.erf'
    decompress_proc = None
    flood_proc = None


    def flood(self, lzo_data=None, duration=None, speed=0):
        # to prevent this script from using too much storage, we automatically clean out the uncompressed files once they take up 20 gb
        if self.getStorageUsage() > 20000000000:
            print('Cleaning out excess stored data')
            subprocess.call('sudo rm -r {0}'.format(self.EXTRACTED_DIR), shell=True)
            subprocess.call('sudo mkdir {0}'.format(self.EXTRACTED_DIR), shell=True)

        # if no decompressed file is specified, we take the compressed file and decompress it
        lzo_data = self.CAPTURE_FILE.format(self.getIndex()[0] if not lzo_data else lzo_data)
        timestamp = int(time.time())
        decompressed_data = self.EXTRACTED_FILE.format(str(timestamp))
        decompression_opts = ' '.join(['sudo', '../run', 'lzop', '-d', '-o', decompressed_data, '-f', lzo_data])

        self.decompress_proc = subprocess.Popen(decompression_opts, shell=True)
        self.decompress_proc.wait()
        self.decompress_proc = None

        flood_opts = ['sudo', '../run', 'dagflood', '-f', decompressed_data, '-d', 'dag0']
        if duration:
            flood_opts.extend(['-t', str(duration)])
        # 0 will replay live, a positive number will play at that number of mbit, and a negative number or null will replay at line rate
        if int(speed) == 0:
            flood_opts.append('-R')
        elif speed > 0:
            flood_opts.extend(['-w', str(speed) + 'm'])
        flood_opts.append('-v')
        self.flood_proc = subprocess.Popen(' '.join(flood_opts), shell=True)
        self.flood_proc.wait()
        self.flood_proc = None

    def isRunning(self):
        return (self.flood_proc or self.decompress_proc)

    def term(self):
        if self.decompress_proc:
            # this throws a system permissions error if I try to use proc.terminate(), so we have to force it
            os.system("sudo kill {0}".format(str(self.decompress_proc.pid)))
            self.decompress_proc = None
        time.sleep(0.1)
        if self.flood_proc:
            os.system("sudo kill {0}".format(str(self.flood_proc.pid)))
            self.flood_proc = None

    @staticmethod
    def getStorageUsage():
        folder_size = 0
        for (path, dirs, files) in os.walk(FlashFlooder.EXTRACTED_DIR):
            for file in files:
                filename = os.path.join(path, file)
                folder_size += os.path.getsize(filename)
        return folder_size

    @staticmethod
    def getIndex():
        return os.listdir(FlashFlooder.CAPTURE_DIR)

def process_request_thread(flooder, l, d, s):
    flooder.flood(l, d, s)


app = Flask(__name__)

global f
f = FlashFlooder()


@app.route('/', methods=['GET'])
def root():
    return render_template('index.html')


@app.route('/flood', methods=['POST'])
def flood():
    data = request.form
    print('Processing request with parameters {0}'.format(data))
    file = data['file'] if 'file' in data else None
    duration = data['duration'] if 'duration' in data else 30
    speed = data['speed'] if 'speed' in data else 100
    t = Thread(target=process_request_thread, args=(f, file, duration, speed))
    t.start()
    return json.dumps({'status': 'initialized', 'message': 'the system is initialized and will begin flooding momentarily'})


@app.route('/kill', methods=['POST'])
def kill():
    if f.isRunning():
        f.term()
        return json.dumps({'status': 'killed', 'message': 'the system process has been killed'})
    else:
        return json.dumps({'status': 'inactive', 'message': 'the system is currently not active'})


@app.route('/status', methods=['POST'])
def status():
    if f.decompress_proc:
        return json.dumps({'status': 'decompressing', 'message': 'the system is currently decompressing the data'})
    elif f.flood_proc:
        return json.dumps({'status': 'flooding', 'message': 'the system is currently flooding the data'})
    else:
        return json.dumps({'status': 'inactive', 'message': 'the system is currently not active'})

@app.route('/file_index', methods=['POST'])
def file_index():
        return json.dumps({'files': FlashFlooder.getIndex()})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
