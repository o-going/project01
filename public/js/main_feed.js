$(function() {
  $('#customFile').change(function(event){
    let path = $('#customFile').val().split('\\');
    $('label[for=customFile]').html(path[path.length-1]);
  });

  $('#btn-upload-feed').click(function(event){
    let feed = $('#message').val();
    let pictures = $('#customFile').val();

    console.log(feed);
    console.log(pictures);

    let formData = new FormData();
    formData.append("feed", feed);
    formData.append("file", $('#customFile')[0].files[0]);

    $.ajax({
      url: "/upload_feed",
      enctype: 'multipart/form-data',
      method: "POST",
      processData : false,
      contentType : false,
      data : formData,
      success: (json) => {
        window.location.href = "./main_feed";
      }
    })
  })
})
