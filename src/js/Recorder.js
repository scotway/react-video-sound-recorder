import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

class Recorder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      streams: [],
      videoUrl: '',
      countdown: 0,
      audioName: '',
      // isSupported: false,
      isRecording: false,
      isVideoLoaded: false,
      isPlaying: false,
      videoPosition: 0,
      currentTime: 0,
    };

    this.fillColor = '#274370';
    this.strokeColor = '#4C6DC4';

    this.countdownSteps = [
      'Record',
      'Ready',
      'Start',
      'GO!',
      'Stop',
      'Stop',
    ];

    this.recInt = false;

    this.mediaRecorder = false;
    this.audioCtx = new (window.AudioContext || webkitAudioContext)();
    this.canvasCtx = false;
    this.chunks = [];
  }

  componentDidMount() {
    this.canvasCtx = this.refs.canvas.getContext('2d');

    if (navigator.mediaDevices.getUserMedia) {
      console.log('getUserMedia supported.');
      this.setState({
        isSupported: true,
      });

      const constraints = { audio: true };
      const onError = function (err) {
        console.log(`The following error occured: ${err}`);
      };

      navigator.mediaDevices.getUserMedia(constraints).then((stream) => { this.onSuccess(stream); }, onError);

      window.onresize = () => {
        this.refs.canvas.width = document.getElementById('app').offsetWidth;
      };

      window.onresize();
    }
  }

  onSuccess(stream) {
    this.mediaRecorder = new MediaRecorder(stream);
    this.visualizeStream(stream);

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: 'audio/webm; codecs=opus' });
      this.chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      const stream = {
        audioURL,
        name: `${this.state.audioName}.webm`,
      };

      this.state.streams.push(stream);
      this.setState({
        audioName: '',
      });
    };

    this.mediaRecorder.ondataavailable = (e) => {
      this.chunks.push(e.data);
    };
  }

  removeAudio(index) {
    _.pullAt(this.state.streams, [index]);
    this.forceUpdate();
  }


  updateScrubber() {
    this.setState({
      videoPosition: (this.refs.video.currentTime / this.refs.video.duration) * 100,
      currentTime: this.refs.video.currentTime,
    });
  }

  scrubVideo(e) {
    if (!this.state.isPlaying) {
      const duration = this.refs.video.duration;
      this.refs.video.currentTime = duration * (e.target.value / 100);

      this.setState({
        videoPosition: e.target.value,
        currentTime: parseFloat(duration * (e.target.value / 100)).toFixed(2),
      });
    }
  }

  visualizeStream(stream) {
    const source = this.audioCtx.createMediaStreamSource(stream);

    const analyser = this.audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    // analyser.connect(audioCtx.destination);

    const draw = () => {
      const WIDTH = this.refs.canvas.width;
      const HEIGHT = this.refs.canvas.height;

      requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      this.canvasCtx.fillStyle = this.fillColor;
      this.canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);


      this.canvasCtx.lineWidth = 2;
      this.canvasCtx.strokeStyle = this.strokeColor;

      this.canvasCtx.beginPath();

      const sliceWidth = WIDTH * 1.0 / bufferLength;
      let x = 0;


      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * HEIGHT / 2;

        if (i === 0) {
          this.canvasCtx.moveTo(x, y);
        } else {
          this.canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      this.canvasCtx.lineTo(this.refs.canvas.width, this.refs.canvas.height / 2);
      this.canvasCtx.stroke();
    };

    draw();
  }

  loadVideo(e) {
    // console.log(e.target.files);
    const objectURL = window.URL.createObjectURL(e.target.files[0]);
    // console.log(objectURL);

    this.setState({
      videoUrl: objectURL,
      isVideoLoaded: true,
    });
  }

  playAll() {
    const audios = document.getElementsByTagName('audio');

    if (!this.state.isPlaying) {
      this.refs.video.volume = 0;
      this.refs.video.ontimeupdate = () => {
        this.updateScrubber();
      };
      this.refs.video.play();
      _.map(audios, (audio) => {
        audio.currentTime = (this.refs.video.currentTime / this.refs.video.duration) * 100;
        audio.play();
      });
    } else {
      this.refs.video.pause();
      _.map(audios, (audio) => {
        // audio.currentTime = (this.refs.video.currentTime / this.refs.video.duration) * 100;
        audio.pause();
      });
    }

    this.setState({
      isPlaying: !this.state.isPlaying,
    });
  }

  toggleRecord(play = true) {
    if (!this.state.isRecording && play) {
      this.setState({
        countdown: this.state.countdown + 1,
      });
      this.recInt = setInterval(() => {
        if (this.state.countdown === 4) {
          this.mediaRecorder.start();
          if (this.state.isVideoLoaded) {
            this.refs.video.volume = 0;
            this.refs.video.currentTime = 0;
            this.refs.video.play();

            this.refs.video.ontimeupdate = () => { this.updateScrubber(); };
          }
          clearInterval(this.recInt);
        }
        this.setState({
          countdown: this.state.countdown + 1,
        });
      }, 600);
    } else {
      clearInterval(this.recInt);
      this.mediaRecorder.stop();
      if (this.state.isVideoLoaded) {
        this.refs.video.pause();
      }
    }

    this.setState({
      isRecording: !this.state.isRecording,
      countdown: 0,
    });
  }

  render() {
    const buttonClasses = this.state.isRecording && this.state.countdown >= 4 ?
      'record-button record-button--on' : 'record-button';

    const videoInput = (this.state.isVideoLoaded) ? (
      <span>
        <video
          ref="video"
          className="video"
                // controls
          onEnded={() => {
                  this.toggleRecord(false);
                }}
          src={this.state.videoUrl}
        />
        <div>Current Time: {this.state.currentTime}</div>
        <button
          className="play-button"
          onClick={() => {
                    this.playAll();
                  }}
        >
          { !this.state.isPlaying ? 'Play' : 'Stop' }
        </button>
      </span>
    ) : (
      <input
        type="file"
        className="uploader"
        onChange={(e) => { this.loadVideo(e); }}
        accept="video/*"
      />
    );

    // console.log(this.state.videoPosition);
    const rangeSlider = (this.state.isVideoLoaded) ? (
      <input
        type="range"
        min="0"
        max="100"
        value={this.state.videoPosition}
        onChange={(e) => { this.scrubVideo(e); }}
        className="visualizer-range"
      />
    ) : false;

    return (
      <section className={this.props.className}>
        <div className="grid-x grid-margin-x">
          <div ref="main" className="cell medium-5">
            <div className="grid-x grid-margin-x">
              <div className="cell medium-7">
                <input
                  type="text"
                  value={`${this.state.audioName}`}
                  onChange={(e) => {
                      this.setState({
                        audioName: e.target.value,
                      });
                    }}
                />
              </div>
              <div className="cell medium-5">
                <button
                  ref="record"
                  className={buttonClasses}
                  onClick={() => {
                      if (this.state.audioName === '') {
                        alert('Please supply a filename');
                      } else {
                        this.toggleRecord();
                      }
                    }}
                >
                  { this.countdownSteps[this.state.countdown]}
                </button>
              </div>
              <ul className="cell medium-12">
                {
                  _.map(this.state.streams, ({ audioURL, name }, key) => (
                    <li className="audio_track" key={key}>
                      <a href={audioURL} download={name}>{name}</a>
                      <span>
                        <audio controls>
                          <source src={audioURL} type="audio/ogg" />
                        </audio>
                        <button
                          className="delete-button"
                          onClick={() => {
                          this.removeAudio(key);
                        }}
                        > X
                        </button>
                      </span>
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>
          <div className="cell medium-7">
            {videoInput}
          </div>
        </div>
        {rangeSlider}
        <canvas ref="canvas" className="visualizer" height="60px" />
      </section>
    );
  }
}

Recorder.propTypes = {
  className: PropTypes.string.isRequired,
};

export default Recorder;
