//Use Foursquare API to get restaurant data to populate model
var url = 'https://api.foursquare.com/v2/venues/search';
var response, vm, map, marker;

//Constructor function to format Restaurant info
var Restaurant = function(data) {
    var self = this;
    this.name = data.name;
    this.type = data.categories.length > 0 ? data.categories[0].name : "";
    this.address = data.location.address + ' ' + data.location.city + ', ' + data.location.state + ' ' + data.location.postalCode;
    this.contact = data.contact.formattedPhone;
    this.url = data.url;

    this.position = {
        lat: data.location.lat,
        lng: data.location.lng
    };
};

//Show infowindow when user clicks restaurant in list view
var restaurantClick = function(infowindowData) {
    new google.maps.event.trigger(infowindowData.marker, 'click');
    bounds.extend(infowindowData.marker.position);
};


var getData = function(restaurants) {
    $.ajax({
        url: url,
        dataType: 'json',
        data: {
            client_id: "NMLBFZ3KLTVSOMN12X1SVT4AQPXXZEX3QV1444PQR0KSBDT2",
            client_secret: "GVQGVWWR3KASGSBCLPZWIGHMHCTVEHOIZRRFIVTW5KO3X4I2",
            v: 20180222,
            near: "new york city",
            query: "restaurant",
            async: true,
        },
        success: function(data) {
            response = data.response.venues;
            for (var i = 0; i < response.length; i++) {
                restaurants.push(new Restaurant(response[i]));
            }
            console.log(restaurants());
             
            //Create markers and infowindows for the marker
            restaurants().forEach(function(restaurantData) {
                this.position = restaurantData.position;
                this.name = restaurantData.name;
                this.address = restaurantData.address;
                this.contact = restaurantData.contact;
                this.url = restaurantData.url;
                
                //Style the markers a bit. This will be our listing marker icon.
                var defaultIcon = makeMarkerIcon('0091ff');

                // //Create a "highlighted location" marker color for when the user mouses over the marker
                var highlightedIcon = makeMarkerIcon('FFFF24');

                //Create markers and infowindows for each location
                marker = new google.maps.Marker({
                    position: this.position,
                    name: this.name,
                    map: map,
                    animation: google.maps.Animation.DROP,
                    address: this.address,
                    contact: this.contact,
                    url: this.url,
                    icon: defaultIcon,
                });
                //Attach markers to restaurant objects
                restaurantData.marker = marker;

                //Make marker bounce and
                marker.addListener('click', function() {
                    var marker = this;
                    toggleBounce(marker);
                    setTimeout(function() {
                        marker.setAnimation(null);
                    }, 1400);
                    map.setZoom(14);
                    map.setCenter(marker.getPosition());
                });

                //Marker bounces on click
                function toggleBounce(marker) {
                    if (marker.getAnimation() !== null) {
                        marker.setAnimation(null);
                    } else {
                        marker.setAnimation(google.maps.Animation.BOUNCE);
                    }
                }
                //Click on marker to open infowindow
                marker.addListener('click', function() {
                    populateInfoWindow(this, infowindow);
                });
                //Populate info windows with api data
                populateInfoWindow = function(mapMarker, infowindow) {
                    if (infowindow.marker != mapMarker) {
                        infowindow.setContent('');
                        infowindow.marker = mapMarker;
                        infowindow.addListener('closeclick', function() {
                            infowindow.marker = null;
                        });
                        //Get image of restaurant
                        var windowContent = '<h2 id="windowName">' + mapMarker.name + '</h2>' + '<div id="pano"></div>' +
                            '<div class="windowStyles">' + mapMarker.address + '</div>' +
                            '<div class="windowStyles">' + mapMarker.contact + '</div>' +
                            '<div class="windowStyles"><a target="_blank" href="' + mapMarker.url + '">' +
                            'Visit their website' + '</div>';
                        var radius = 50;
                        var getStreetView = function(data, status) {
                            if (status == google.maps.StreetViewStatus.OK) {
                                var nearStreetViewLocation = data.location.latLng;
                                var heading = google.maps.geometry.spherical.computeHeading(
                                    nearStreetViewLocation, marker.position);
                                infowindow.setContent(windowContent);
                                var panoramaOptions = {
                                    position: nearStreetViewLocation,
                                    pov: {
                                        heading: heading,
                                        pitch: 10
                                    }
                                };
                                var panorama = new google.maps.StreetViewPanorama(
                                    document.getElementById('pano'), panoramaOptions);
                            } else {
                                infowindow.setContent('div' + restaurantData.name + '</div>' +
                                    '<div>No Street View Found</div>');
                            }
                        };
                        streetViewService.getPanoramaByLocation(mapMarker.position, radius, getStreetView);
                        //Open the infowindow on the correct marker
                        infowindow.open(map, mapMarker);
                    }
                };
                restaurantData.infowindow = populateInfoWindow;
                bounds.extend(marker.position);

                //Change colors of the marker with mouseove
                marker.addListener('mouseover', function() {
                    this.setIcon(highlightedIcon);
                });
                //Change back to original color with mouseout
                marker.addListener('mouseout', function() {
                    this.setIcon(defaultIcon);
                });

              
                //Give markers unique color scheme
                function makeMarkerIcon(markerColor) {
                    var markerImage = new google.maps.MarkerImage(
                        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
                        '|40|_|%E2%80%A2',
                        new google.maps.Size(21, 34),
                        new google.maps.Point(0, 0),
                        new google.maps.Point(10, 34),
                        new google.maps.Size(21, 34));
                    return markerImage;
                }                   
            });
        },
        error: function() {
            alert('Sorry! Data unavailable at this time. Please refresh the page and try again.');
        }
    });

}

//Use Foursquare data to populate the list
var ViewModel = function() {
    var self = this;
    self.restaurants = ko.observableArray([]);
    self.searchRestaurants = ko.observable('');
    self.title = ko.observable('eat nyc');
    self.attribution = ko.observable('Data by Foursquare API');
    self.visibleNav = ko.observable(false);     
    self.restaurantClick = restaurantClick;

    self.toggleNav = function() {
          self.visibleNav(!self.visibleNav());
    };
    //Filter view list and markers
    self.filteredList = ko.computed(function() {
        var filter = self.searchRestaurants().toLowerCase();
        if (!filter) {
            for (var i = 0; i < self.restaurants().length; i++) {
                if (self.restaurants()[i].marker) {
                    self.restaurants()[i].marker.setVisible(true);
                }
            }
            return self.restaurants();
        } else {
            return ko.utils.arrayFilter(self.restaurants(), function(restaurant) {
                var filtered = restaurant.name.toLowerCase().indexOf(filter) > -1;
                restaurant.marker.setVisible(filtered);
                return filtered;
            });
        }
    }, self.filteredList);
    
    getData(self.restaurants);
}

var bounds, infowindow, streetViewService;  

//Create map and use Foursquare data to get locations and restaurant details
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 40.71427,
            lng: -74.00597
        },
        zoom: 13,
        mapTypeControl: false
    });      
    bounds = new google.maps.LatLngBounds();
    infowindow = new google.maps.InfoWindow();
    streetViewService = new google.maps.StreetViewService();

    vm = new ViewModel();
    ko.applyBindings(vm);  
    
}





function googleError() {
    alert('Sorry, Google Maps is not available at this time.');
}
