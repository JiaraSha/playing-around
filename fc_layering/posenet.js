
let camera3D, scene, renderer, cube;
let dir = 0.01;
let myCanvas, myVideo, p5CanvasTexture, poseNet;
let nose, circleMask, angleOnCircle, myAvatarObj;

let videoOptions, preferredCam;
let poses = [];


function setup() {
    myCanvas = createCanvas(612, 612);
    myCanvas.hide();
    myCanvas.fill("d0e2e3");
    createPullDownForCameraSelection();
    videoOptions = {
        audio: true, 
        video: {
            width: window.innerWidth,
            height: window.innerHeight,
            sourceId: preferredCam
        }
    }
    myVideo = createCapture(videoOptions);
    myVideo.hide();
    poseNet = ml5.poseNet(myVideo, modelReady);
    poseNet.on("pose", gotPoses);

    init3D();
}


function modelReady() {
    console.log("model ready");
    progress = "loaded";
    poseNet.singlePose(myVideo);
}

// Show a pose (i.e. a person) only if probability more than 0.1
minPoseConfidence = 0.9;
// Show a body part only if probability more than 0.3
minPartConfidence = 0.9;


// A function that gets called every time there's an update from the model
function gotPoses(results) {
    //console.log(results);
    if (!results[0]) return;
    poses = results;
    progress = "predicting";
}

function init3D() {
    scene = new THREE.Scene();
    //camera3D = new THREE.OrthographicCamera(-10,width,-10,height, 0.1, 1000);
    //camera3D = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, 1, 1000);
    camera3D = new THREE.PerspectiveCamera( 45, width / height, 1, 1000 );

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
    //renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    var videoGeometry = new THREE.PlaneGeometry(912,912);
    p5CanvasTexture = new THREE.Texture(myCanvas.elt);  //NOTICE THE .elt  this give the element
    let videoMaterial = new THREE.MeshBasicMaterial({ map: p5CanvasTexture, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
    myAvatarObj = new THREE.Mesh(videoGeometry, videoMaterial);

    angleOnCircle = Math.PI;
    positionOnCircle(angleOnCircle, myAvatarObj);
    scene.add(myAvatarObj);

    moveCameraWithMouse();
    camera3D.position.z = 0;
    animate();
}

  function positionOnCircle(angle, mesh) {
    //imagine a circle looking down on the world and do High School math
    let distanceFromCenter = 660;//850
    x = distanceFromCenter * Math.sin(angle);
    z = distanceFromCenter * Math.cos(angle);
    mesh.position.set(x, 0, z);
    mesh.lookAt(0, 0, 0);
}


function animate() {
    requestAnimationFrame(animate);
    p5CanvasTexture.needsUpdate = true;  //tell renderer that P5 canvas is changing
    renderer.render(scene, camera3D);
}

function draw() {
   //clear();
   drawKeypoints();
   drawSkeleton();
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i += 1) {
      // For each pose detected, loop through all the keypoints
      const pose = poses[i].pose;
      for (let j = 0; j < pose.keypoints.length; j += 1) {
        // A keypoint is an object describing a body part (like rightArm or leftShoulder)
        const keypoint = pose.keypoints[j];
        // Only draw an ellipse is the pose probability is bigger than 0.02
        if (keypoint.score > 0.02) {
          fill(255, 0, 0);
          noStroke();
          image(myVideo, keypoint.position.x, keypoint.position.y, slider.value, slider.value);
        }
      }
    }
  }

  function drawSkeleton() {
    // Loop through all the skeletons detected
    for (let i = 0; i < poses.length; i++) {
      let skeleton = poses[i].skeleton;
      // For every skeleton, loop through all body connections
      for (let j = 0; j < skeleton.length; j++) {
        let partA = skeleton[j][0];
        let partB = skeleton[j][1];
        stroke(255, 250, 250);
        line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
      }
    }
  }

  var slider = document.getElementById("myRange");
  var output = document.getElementById("demo");
  // Display the default slider value
  
  // Update the current slider value (each time you drag the slider handle)
  slider.oninput = function() {
    slider.value = this.value;
  }
























/////MOUSE STUFF

var onMouseDownMouseX = 0, onMouseDownMouseY = 0;
var onPointerDownPointerX = 0, onPointerDownPointerY = 0;
var lon = -90, onMouseDownLon = 0;
var lat = 0, onMouseDownLat = 0;
var isUserInteracting = false;


function moveCameraWithMouse() {
    document.addEventListener('keydown', onDocumentKeyDown, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);
    document.addEventListener('wheel', onDocumentMouseWheel, false);
    window.addEventListener('resize', onWindowResize, false);
    camera3D.target = new THREE.Vector3(0, 0, 0);
}

function onDocumentKeyDown(event) {
    //if (event.key == " ") {
    //in case you want to track key presses
    //}
}

function onDocumentMouseDown(event) {
    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
    isUserInteracting = true;
}

function onDocumentMouseMove(event) {
    if (isUserInteracting) {
        lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
        lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
        computeCameraOrientation();
    }
}

function onDocumentMouseUp(event) {
    isUserInteracting = false;
}

function onDocumentMouseWheel(event) {
    camera3D.fov += event.deltaY * 0.05;
    camera3D.updateProjectionMatrix();
}

function computeCameraOrientation() {
    lat = Math.max(- 30, Math.min(30, lat));  //restrict movement
    let phi = THREE.Math.degToRad(90 - lat);  //restrict movement
    let theta = THREE.Math.degToRad(lon);
    camera3D.target.x = 10000 * Math.sin(phi) * Math.cos(theta);
    camera3D.target.y = 10000 * Math.cos(phi);
    camera3D.target.z = 10000 * Math.sin(phi) * Math.sin(theta);
    camera3D.lookAt(camera3D.target);
}


function onWindowResize() {
    camera3D.aspect = window.innerWidth / window.innerHeight;
    camera3D.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log('Resized');
}

function createPullDownForCameraSelection() {
    //manual alternative to all of this pull down stuff:
    //type this in the console and unfold resulst to find the device id of your preferredwebcam, put in sourced id below
    //navigator.mediaDevices.enumerateDevices()
    preferredCam = localStorage.getItem('preferredCam')
    if (preferredCam) {
        videoOptions = {
            video: {
                width: window.innerWidth,
                height: window.innerHeight,
                sourceId: preferredCam
            }
        };
    } else {
        videoOptions = {
            audio: true, video: {
                width: window.innerWidth,
                height: window.innerHeight,
            }
        };
    }
    navigator.mediaDevices.enumerateDevices().then(function (d) {
        var sel = createSelect();
        sel.position(10, 10);
        for (var i = 0; i < d.length; i++) {
            if (d[i].kind == "videoinput") {
                let label = d[i].label;
                let ending = label.indexOf('(');
                if (ending == -1) ending = label.length;
                label = label.substring(0, ending);
                sel.option(label, d[i].deviceId)
            }
            if (preferredCam) sel.selected(preferredCam);
        }
        sel.changed(function () {
            let item = sel.value();
            console.log(item);
            localStorage.setItem('preferredCam', item);
            videoOptions = {
                video: {
                    optional: [{
                        sourceId: item
                    }]
                }
            };
            myVideo.remove();
            myVideo = createCapture(videoOptions, VIDEO);
            myVideo.hide();
            console.log(videoOptions);
        });
    });
}