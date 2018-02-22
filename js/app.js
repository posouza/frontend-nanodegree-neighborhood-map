// MODEL - This is where the information the map uses to work is stored.
function MapSettings() {
  this.initialCoords = { lat: 40.825412, lng: -73.956994 },
  this.locations = [
    { name: "The City College of New York", coords: { lat: 40.820047 , lng: -73.949262 }, id: 0 },
    { name: "Yankee Stadium", coords: { lat: 40.829651 , lng: -73.926170 }, id: 1 },
    { name: "Apollo Theater", coords: { lat: 40.810010 , lng: -73.950056 }, id: 2 },
    { name: "Columbia University", coords: { lat: 40.807852 , lng: -73.962138 }, id: 3 },
    { name: "Harlem Public", coords: { lat: 40.828721 , lng: -73.948466 }, id: 4 },
    
  ];
}
var mapSettings = new MapSettings();

function MapError(){
  var map = $('#map');
  map.addClass('container');
  map.html('<div class="error-message">There was en error retrieving the map. Please refresh the page to try again.</div>');
}

var map, markers, infowindow, populateInfoWindow, previousMarker, disablePreviousMarker;
function initMap(){
  // The Map is initialized here using the configuration we find in mapSettings.
  map = new google.maps.Map(document.getElementById('map'), {
    center: mapSettings.initialCoords,
    zoom: 13
  });

  // Centralizes the screen if a user resizes it. 
  google.maps.event.addDomListener(window, 'resize', function(){
    fitBounds();
  });

  // The initial PoI locations are created here and set to the map.
  markers = createMarkersFromLocations(mapSettings.locations);
  function createMarkersFromLocations(locations){
    var tempMarkers = [];
    locations.forEach(function(value, index){
      var marker = new google.maps.Marker({
        position: value.coords,
        map: map,
        animation: google.maps.Animation.DROP,
        title: value.name,
      });
      marker.addListener('click', function(e){
        disablePreviousMarker();

        this.setAnimation(google.maps.Animation.BOUNCE);
        populateInfoWindow(this);
        previousMarker = this;
        e.stop();
      });

      tempMarkers.push(marker);
    });
    return tempMarkers;
  }

  disablePreviousMarker = function(){
    if (previousMarker !== undefined){
      previousMarker.setAnimation(null);
    }
  };
  // Auxiliary function used to center the map and provide space
  // for the infowindows.
  function fitBounds(bounds){
    if (bounds !== undefined){
      map.setCenter(bounds.getPosition());
      map.panBy(0, -150);
    }
    else{
      map.setCenter(mapSettings.initialCoords);
    }
  }

  // Instantiates a new infowindow to be used when the markers are selected.
  infowindow = new google.maps.InfoWindow();
  infowindow.addListener('closeclick', function(){
    infowindow.close();
  });

  // Function used to populate the infowindow with content from the
  // wikipedia service.
  populateInfoWindow = function(marker){

    // Send an ajax call to Wikipedia to retrieve information on the points of interest.
    // var wikiEndPoint = 'https://en.wikipedia.org/w/api.php?' +
    var wikiUrl = 'https://en.wikipedia.org/w/api.php?' +
    'format=json&' +
    'action=parse&' +
    'section=0&' +
    'page=' + marker.title;
  // AJAX request object.
    $.ajax({
    url: wikiUrl,
    dataType: 'jsonp',
    contentType: 'text/plain',

      //Retrieves the markup data from WikiPedia and set it to the infowindow content.
      success: function(data){

        var markup = data['*'];

        var blurb = $('<div></div>').html(markup);

        var image = $('<div></div>').html(blurb.find('img').first());
        image.addClass('info-image');

        // Remove all elements from the blurb that aren't text.
        blurb.children(':not(p)').remove();

        // Replace the links with regular text.
        blurb.find('a').each(function() { $(this).replaceWith($(this).html()); });

        // Trims the text if too large.
        if (blurb.children('p:nth-of-type(2)').text().length > 500){
          blurb.children('p').slice(2).remove();
        }

        // Set the wikipedia content to the infowindow on the marker.
        infowindow.setContent(image.html() + blurb.html() + "<div class='attribution'>Powered by Wikipedia.</div>");
      },
      error: function(){
        infowindow.setContent("<div class='info-error'>There was a problem with the Wikipedia search. Please try again later or contact the administrator.</div>");
      }
    });

    // Open the info window on the marker.
    infowindow.open(map, marker);
    fitBounds(marker);
  };
}

// Knockout ViewModel.
function AppViewModel(){
  var self = this;
  this.mobileToggle = ko.observable(false);
  this.locations = mapSettings.locations;
  this.filteredLocations = ko.observableArray(this.locations);

  // Filters the list of locations on the left Menu using the value
  // the user typed in the text control.
  this.filterViewList = function(data, event){
    var value = event.target.value,
        filteredLocationNames = [];
    // If the control is clear, add all locations to the array of locations.
    if (value === ''){
      self.filteredLocations(self.locations);
    }
    // Else, filter the locations to only those that share a similar name and
    // replace the locations array with that new filtered array.
    else{
      self.filteredLocations(self.locations.filter(function(locations){
        return locations.name.toLowerCase().includes(value.toLowerCase());
      }));
    }

    // Adds the names of the filtered locations to an array called
    // filteredLocationNames.
    self.filteredLocations().forEach(function(value){
      filteredLocationNames.push(value.name);
    });

    // Disables or enables each marker on the map, depending on whether
    // their names can be found in the filtered list of location names.
    markers.forEach(function(value, index){
      if (filteredLocationNames.indexOf(value.title) > - 1) {
        value.setVisible(true);
      }
      else
        value.setVisible(false);
    });
  };

  // Gets the index of the selected List element in the DOM.
  this.getIndex = function(event){
    var index = event.target.getAttribute('data-index');
    return index;
  };

  // Selects the location on the list and displays the infowindow on
  // the map at the proper marker's location.
  this.selectLocation = function(data, event){
    var index = self.getIndex(event),
        currentMarker = markers[index];
    // Prevents previous marker to keep its animation.    
    disablePreviousMarker();
    currentMarker.setAnimation(google.maps.Animation.BOUNCE);
    populateInfoWindow(currentMarker);
    previousMarker = currentMarker;
  };

  // Animates the bouncing of the markers if the user is hovering over it.
  this.ListMarkerBouncer = function(data, event){
    var index = self.getIndex(event);
    if (event.type === 'mouseover'){
      markers[index].setAnimation(google.maps.Animation.BOUNCE);
    }
    else if(event.type ==='mouseout'){
      markers[index].setAnimation(null);      
    }
  };

  // Expands and retracts the menu in the mobile web version of the app.
  this.openMobileControls = function(){
    var toggle = this.mobileToggle();
    if (toggle){
      this.mobileToggle(false);
    }
    else{
      this.mobileToggle(true);
    }
  };
}

ko.applyBindings(new AppViewModel());