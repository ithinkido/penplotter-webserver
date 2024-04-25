// Update port list
function updatePorts() {
  axios
    .get("/update_ports")
    .then(function (response) {
      // handle success
      if (response.status == 200) {
        // Remove old content from list
        jQuery(".portList").html("");
        for (var content of response.data.content) {
          jQuery(".portList").append(
            `<option value="${content}">${content}</option>`
          );
        }
      }
    })
    .catch(function (error) {
      notify(error, "danger");
      console.error(error);
    })
    .then(function () { });
}


// Auto detect Baudrate
function updateBaud() {
  // load spinner icon while the pi check for baudrate
  jQuery(".updateBaud").html(
    '<a href="#" class="uk-icon-link mac-button updateBaud" title="Auto detect baudrate" uk-spinner></a>'
  );

  // send port info over first
  jQuery
    .post(
      "/update_baud",
      { selected_port: jQuery("#portList").val() },
      function (response) {
        console.log(response);
        if (response != "None") {
          // change to new baudrate value
          jQuery(".baudRate").val(response);
        } else {
          notify("Plotter not detected", "warning");
        }
        // put back normal icon
        jQuery(".updateBaud").html(
          '<a href="#" class="uk-icon-link mac-button updateBaud" title="Auto detect baudrate" data-uk-tooltip data-uk-icon="icon: search"></a>'
        );
      }
    )

    .fail(function (error) {
      notify(error, "danger");
      console.error(error);
    })
    .then(function () { });
}

// Update file list
function updateFiles() {
  axios
    .get("/update_files")
    .then(function (response) {
      // handle success
      if (response.status == 200) {
        // Remove old content from list
        jQuery("#fileList").html("");

        for (var content of response.data.content) {
          jQuery("#fileList").append(
            `<li> ${renderFileListElement(content.name)} </li>`
          );
        }
      }
    })
    .catch(function (error) {
      notify(error, "danger");
      console.error(error);
    })
    .then(function () { });
}

// Update plot status
function plot_status() {
  axios
    .get("/plot_status")
    .then(function (response) {
      if (response.status == 200) {
        var ps = response.data.plot_status;
        console.log("####PS#####" +ps)
        var file = response.data.file
        if (ps == "Plotting"){
          jQuery(".stopPlot").removeClass("uk-hidden");
          jQuery(".selectedFilename").html(file);
        }
        else {
          jQuery(".stopPlot").addClass("uk-hidden");
        }
      }
    })
    .catch(function (error) {
      notify(error, "no status");
      console.error(error);
    })
    .then(function () { });
}


// Handle file selection
function selectFile(element) {
  const filename = jQuery(element).data("filename");

  // Update form
  jQuery("#fileName").val(filename);

  // Update list
  jQuery("#fileList li").removeClass("uk-alert-primary");
  const li = jQuery(element).parents("li")[0];
  if (li) jQuery(li).addClass("uk-alert-primary");

  // Update sidebar
  jQuery(".selectedFilename").html(filename);

  axios
  .post("/selected_file", { filename: filename })
  .then(function (response) {
    // handle success
    if (response.status == 200) {
      console.log("GLOBAL CUURENT FILE UPDATED TO : " +response.data.current_file)
    }
  })
  .catch(function (error) {
    notify(error, "danger");
    console.error(error);
  })
  .then(function () { });
}

// Handle file deletion
function deleteFile(element) {
  const filename = jQuery(element).data("filename");

  axios
    .post("/delete_file", { filename: filename })
    .then(function (response) {
      // handle success
      if (response.status == 200) {
        // Remove old content from list
        notify(response.data, "warning");
        updateFiles();
      }
    })
    .catch(function (error) {
      notify(error, "danger");
      console.error(error);
    })
    .then(function () { });
}

function previewFile(element) {
  const filename = jQuery(element).data("filename");

  const imgElement = document.querySelector(".preview_canvas img");
  // clear any previous src
  imgElement.removeAttribute("src");

  jQuery("#preview_loader").removeClass("uk-hidden");
  UIkit.modal("#modal-HPGLpreview").show();
  

  axios
    .post("/preview_file", { filename: filename })
    .then(function (response) {
      // handle success
      if (response.status == 200) {
        // Set the src attribute of the img tag with the received SVG data
        const imageData = response.data;
        jQuery("#preview_loader").addClass("uk-hidden");
        imgElement.setAttribute("src", "data:image/svg+xml;base64," + imageData);
        // imgElement.setAttribute("src", "data:image/png;base64," + imageData);
      }
    })
    .catch(function (error) {
      notify(error, "danger");
      console.error(error);
    })
    .then(function () { });
}


// Handle hpgl preview
// function previewFile(element) {
//   const filename = jQuery(element).data("filename");
//   console.log("getting file name " + filename);

//   axios
//     .post("/preview_file", { filename: filename })
//     .then(function (response) {
//       // handle success
//       if (response.status == 200) {
//         // notify(response.data, "success");

//         // fetchAndSetContent("/html/HPGLpreview.html", 'modal-HPGLpreview');
//         UIkit.modal("#modal-HPGLpreview").show();
//       }
//     })
//     .catch(function (error) {
//       notify(error, "danger");
//       console.error(error);
//     })
//     .then(function () { });
// }

// TODO: add pagesize filter for machines eg HP7440 - only A4 etc
// Update page size options
function updatePageSize(element) {
  
  ////////////////////////////////////////////////
  ////////////////////////////////////////////////
}


// Handle file conversion
function convertFileModal(element) {
  const filename = jQuery(element).data("filename");
  jQuery("#convertFile").val(filename);
  UIkit.modal("#modal-convertFile").show();
}

// Handle HPGL preview conversion
function HPGLpreviewModal(element) {
  const filename = jQuery(element).data("filename");
  console.log("HPGL preview " + filename)
  jQuery("#previewFile").val(filename);
  UIkit.modal("#modal-HPGLpreview").show();
}

// Start conversion
function convertFile() {
  const convertData = jQuery("#convertData").serializeArray();
  console.log("convertData", convertData);
  jQuery("#loader").removeClass("uk-hidden");

  // Validation
  if (jQuery("#convertFile").val() == "") {
    notify("No *.svg file selected", "danger");
    return false;
  }

  axios
    .post("/start_conversion", jQuery("#convertData").serialize())
    .then(function (response) {
      // handle success
      if (response.status == 200) {
        if (response.data.includes("File not converted.")) {
          console.error(response);
          notify(response.data, "danger");
        } else {
            console.log(response);
            notify(response.data, "success");
        }

        updateFiles();
        UIkit.modal("#modal-convertFile").hide();
        jQuery("#loader").addClass("uk-hidden");
      }
    })
    .catch(function (error) {
      notify(error, "danger");
      console.error(error);
    });
}

// Display card
function closeCard(element) {
  const card = jQuery(element).data("card");

  jQuery(element).addClass("uk-hidden");
  jQuery("#" + card).addClass("uk-hidden");
  jQuery(".showCard[data-card='" + card + "']").removeClass("uk-hidden");
}

function showCard(element) {
  const card = jQuery(element).data("card");

  jQuery(element).addClass("uk-hidden");
  jQuery("#" + card).removeClass("uk-hidden");
  jQuery(".closeCard[data-card='" + card + "']").removeClass("uk-hidden");
}

// Clear Logs
function clearLog() {
  // Remove old content from log
  jQuery("#statusLog").html("");
  jQuery("#bytes_written").html("");
}

// Start plotting
function startPlot() {
  const plotterData = jQuery("#plotterData").serializeArray();
  console.log("plotterData", plotterData);

  // Validation
  if (jQuery("#fileName").val() == "") {
    notify("No *.hpgl file selected", "danger");
    return false;
  }
  if (jQuery("#portList").val() == null) {
    notify("No COM port selected", "danger");
    updatePorts();
    return false;
  }

  axios
    .post("/start_plot", jQuery("#plotterData").serialize())
    .then(function (response) {
      // handle success
      if (response.status == 200) {
        console.log(response);
      }
    })
    .catch(function (error) {
      notify(error, "danger");
      console.error(error);
    });
}

function stopPlot() {
  
  axios
    .get("/stop_plot")
    .then(function (response) {
      // handle success
      if (response.status == 200) {
        console.log(response);
        notify("Stopped Print", "danger");
        jQuery('#chartContents').addClass('hidden');

        // Update sidebar
        jQuery(".selectedFilename").html("");
        jQuery("#statusLog").html("Plot canceled" + "<br>");
      }
    })
    .catch(function (error) {
      notify(error, "danger");
      console.error(error);
    });
}

// Reboot Pi
function actionReboot() {
  axios
    .post("/action_reboot")
    .then(function (response) {
      // handle success
      if (response.status == 200) {
        UIkit.modal("#modal-reboot").hide();
        notify("Rebooting now", "warning");
      }
    })
    .catch(function (error) {
      notify(error, "danger");
      console.error(error);
    });
}

// Poweroff Pi
function actionPoweroff() {
  axios
    .post("/action_poweroff")
    .then(function (response) {
      // handle success
      if (response.status == 200) {
        UIkit.modal("#modal-poweroff").hide();
        notify("Poweroff now", "danger");
      }
    })
    .catch(function (error) {
      notify(error, "danger");
      console.error(error);
    });
}

function actionTasmota() {
  axios
    .post("/action_tasmota")
    .then(function (response) {
      // handle success
      if (response.status == 200) {
        notify("Tasmota Toggled", "success");
      }
    })
    .catch(function (error) {
      notify(error, "danger");
      console.error(error);
    });
}

function actionUpdatePreview() {

  axios.post('/action_update_preview')
    .then(function (response) {
      // handle success
      if (response.status == 200) {
        //console.error(response);
        source = jQuery("#preview-img").attr("src");
        source = source.split("?", 1);
        new_source = source + "?timestamp=" + new Date().getTime();
        jQuery("#preview-img").attr("src", new_source);
        notify('Preview Updated', 'success');
      }
    })
    .catch(function (error) {
      notify(error, 'danger')
      console.error(error);
    });
}

// Fetch config.ini data and update UI
function updateConfiguration() {
  axios.get('/save_configfile')
    .then(function(response) {
      // handle success
      if (response.status == 200) {

        jQuery('#telegram_token').val(response.data.telegram_token);
        jQuery('#telegram_chatid').val(response.data.telegram_chatid);
        jQuery('#tasmota_enable').val(response.data.tasmota_enable);
        jQuery('#timelapse_enable').val(response.data.timelapse_enable);
        jQuery('#timelapse_auto_start').val(response.data.timelapse_auto_start);
        jQuery('#timelapse_preview').val(response.data.enable_prewiew);
        jQuery('#tasmota_ip').val(response.data.tasmota_ip);
        jQuery('.plotter_name').html(response.data.plotter_name);
        jQuery('.portList').val(response.data.plotter_port).change();
        jQuery('#device').val(response.data.plotter_device).change();
        jQuery('#baudrate').val(response.data.plotter_baudrate).change();
        jQuery('#flowControl').val(response.data.plotter_flowControl).change();
        adjustVisibleOptions();
      }
    })
    .catch(function(error) {
      notify(error, 'danger')
      console.error(error);
    });
}

function adjustVisibleOptions() {
  if (jQuery('#tasmota_enable').val() == 'true') {
    jQuery('.action-tasmota-toggle').closest('li').show();
  } else {
    jQuery('.action-tasmota-toggle').closest('li').hide();
  }
  if (jQuery('#timelapse_enable').val() == 'true' && jQuery('#enable_prewiew').val() == 'true') {
    jQuery('#timelapseContents').show();
  } else {
    jQuery('#timelapseContents').hide();
  }
}

// Fetch config.ini data and display modal
function actionOpenConfig(m) {

  UIkit.modal('#modal-'+ m).show();
  
  axios.get('/save_configfile')
    .then(function(response) {
      // handle success
      if (response.status == 200) {
        jQuery('#telegram_token').val(response.data.telegram_token);
        jQuery('#telegram_chatid').val(response.data.telegram_chatid);
        jQuery('#tasmota_enable').val(response.data.tasmota_enable);
        jQuery('#timelapse_enable').val(response.data.timelapse_enable);
        jQuery('#timelapse_selected').val(response.data.timelapse_selected);
        jQuery('#timelapse_preview').val(response.data.enable_prewiew);
        jQuery('#tasmota_ip').val(response.data.tasmota_ip);
        jQuery('#plotter_name').val(response.data.plotter_name);
        jQuery('#plotter_port').val(response.data.plotter_port).change();
        jQuery('#plotter_device').val(response.data.plotter_device).change();
        jQuery('#plotter_baudrate').val(response.data.plotter_baudrate).change();
        jQuery('#plotter_flowControl').val(response.data.plotter_flowControl).change();
        UIkit.modal('#modal-'+ m).show();
      }
    })
    .catch(function(error) {
      notify(error, 'danger')
      console.error(error);
    });
}

// Save new values in config.ini
function saveConfig($form) {
  console.log('Form Data:', $form.serialize());
  adjustVisibleOptions();

  axios.post('/save_configfile', $form.serialize()) // Serialize the form data here
    .then(function (response) {
      console.log(response);
      // handle success
      if (response.status == 200) {
        notify(response.data, 'success');
      }
    })
    .catch(function (error) {
      notify(error, 'danger');
      console.error(error);
    });
}

