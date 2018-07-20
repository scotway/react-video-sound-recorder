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
    };

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
        this.refs.canvas.width = this.refs.main.offsetWidth;
      };

      window.onresize();
    }
  }

  onSuccess(stream) {
    this.mediaRecorder = new MediaRecorder(stream);
    this.visualizeStream(stream);

    this.mediaRecorder.onstop = () => {
      // const a = document.createElement('a');
      // document.body.appendChild(a);

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

      this.canvasCtx.fillStyle = '#4F4F4F';
      this.canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);


      this.canvasCtx.lineWidth = 2;
      this.canvasCtx.strokeStyle = '#979797';

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

  toggleRecord(play = true) {
    if (!this.state.isRecording && play) {
      this.setState({
        countdown: this.state.countdown + 1,
      });
      this.recInt = setInterval(() => {
        if (this.state.countdown == 4) {
          this.mediaRecorder.start();
          if (this.state.isVideoLoaded) {
            this.refs.video.volume = 0;
            this.refs.video.play();
          }
          clearInterval(this.recInt);
        }
        this.setState({
          countdown: this.state.countdown + 1,
        });
      }, 1000);
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
      <video
        ref="video"
        className="video"
        // controls
        onEnded={() => {
          this.toggleRecord(false);
        }}
        src={this.state.videoUrl}
      />
    ) : (
      <input
        type="file"
        onChange={(e) => { this.loadVideo(e); }}
        accept="video/*"
      />
    );

    return (
      <section ref="main" className={this.props.className}>
        {videoInput}
        <canvas ref="canvas" className="visualizer grid-x grid-margin-x" height="60px" />
        <div className="buttons grid-x grid-margin-x">
          <div className="cell small-4">
            <input
              type="text"
              value={this.state.audioName}
              onChange={(e) => {
                  this.setState({
                    audioName: e.target.value,
                  });
                }}
            />
          </div>
          <div className="cell small-8">
            <button
              ref="record"
              className={buttonClasses}
              onClick={() => {
                  this.toggleRecord();
                }}
            >
              { this.countdownSteps[this.state.countdown]}
            </button>
          </div>
          <ul>
            {
              _.map(this.state.streams, ({ audioURL, name }, key) => (
                <li className="audio_track" key={key}>
                  <a href={audioURL} download={name}>{name}</a>
                  <audio controls>
                    <source src={audioURL} type="audio/ogg" />
                  </audio>
                </li>
              ))
            }
          </ul>
        </div>
      </section>
    );
  }
}

Recorder.propTypes = {
  className: PropTypes.string.isRequired,
};

export default Recorder;
