const uploadInput = document.getElementById('upload-input');
const uploadButton = document.getElementById('upload-button');
const progress = document.getElementById('progress');

uploadButton.addEventListener('click', clickUpload, false);
uploadInput.addEventListener('change', uploadInputChanged, false);

function clickUpload() {
    uploadInput.click();
    progress.textContent = "0%";
}

function uploadProgress(event) {
    //console.log("upload progress");
    if (event.lengthComputable) {
        // calculate the percentage of upload completed
        let percentComplete = event.loaded / event.total;
        percentComplete = parseInt(percentComplete * 100);

        progress.textContent = percentComplete + "%";
    }
}

function uploadInputChanged() {
    //console.log("upload input changed:" + uploadInput.files.length);

    if (uploadInput.files.length > 0) {
        //console.log("uploading files:" + uploadInput.files);
        let formData = new FormData();

        for (let i = 0; i < uploadInput.files.length; i++) {
            let file = uploadInput.files[i];
            formData.append('uploads[]', file, file.name);
        }

        $.ajax({
            url: '/uploadfile',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                progress.textContent = "success!";
            },
            xhr: function () {
                let xhr = new XMLHttpRequest();
                xhr.upload.addEventListener('progress', uploadProgress, false);
                return xhr;
            }
        });
    }
}

