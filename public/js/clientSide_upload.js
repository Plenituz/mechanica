var uploadInput;
var uploadButton;
var progress;

window.addEventListener('load', onload, false);
function onload() {
    uploadInput = document.getElementById('upload_input');
    uploadButton = document.getElementById('upload_button');
    progress = document.getElementById('progress');

    uploadButton.addEventListener('click', clickUpload, false);
    uploadInput.addEventListener('change', uploadInputChanged, false);
    
}

function clickUpload() {
    uploadInput.click();
    progress.textContent = "";
}

function uploadError(err) {
    progress.textContent = "error! try again later, sorry :/";
}

function uploadProgress(event) {
   // console.log("upload progress" + event);
    if (event.lengthComputable) {
        // calculate the percentage of upload completed
        let percentComplete = event.loaded / event.total;
        percentComplete = parseInt(percentComplete * 100);

        progress.textContent = percentComplete + "%";
    } else {
        progress.textContent = "uploading...";
    }
}

function uploadInputChanged() {
   // console.log("upload input changed:" + uploadInput.files.length);

    if (uploadInput.files.length > 0) {
       // console.log("uploading files:" + uploadInput.files);
        let formData = new FormData();

        for (let i = 0; i < uploadInput.files.length; i++) {
            let file = uploadInput.files[i];
            formData.append('uploads[]', file, file.name);
        }

        $.ajax({
            url: document.URL + "/newVersion",
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            error: uploadError,
            success: function (data) {
                progress.textContent = "success!";
                location.reload();
            },
            xhr: function () {
                let xhr = new XMLHttpRequest();
                xhr.upload.addEventListener('error', uploadError, false);
                xhr.upload.addEventListener('progress', uploadProgress, false);
                return xhr;
            }
        });
    }
}

