/**
 * Created by emmilinkola on 03/11/15.
 */

var searchIssues = new SearchIssues();


var app = angular.module('myApp', ['ngRoute', 'uiGmapgoogle-maps']);

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
}]);

app.factory('UserData', function(){
    return {'userId': 0, 'username': undefined, 'showProfile': false};
});

app.controller('messageController', function($scope, $http) {
    /*$scope.latestMessage = Date.parse("2999-11-24T15:24:25.730Z");
     $scope.latestDecision = Date.parse("2999-11-24T15:24:25.730Z");
     $scope.firstMessage = Date.parse("1970-11-24T15:24:25.730Z");
     $scope.firstDecision = Date.parse("1970-11-24T15:24:25.730Z");*/
    $scope.$watch('issue', function(newValue, oldValue) {
        //console.log("Issue muuttu: " + newValue + " oli " + oldValue);
        $scope.messages = [];
        $scope.decisions = [];
        var issue = newValue;
        if (typeof issue !== 'undefined') {
            $scope.getMessages(issue.id);
            $scope.getDecisions(issue.id);
        }

    });

    $scope.deleteMessage = function(messageId){
        console.log("test");
        var config = {
            method: 'DELETE',
        };
        $http.delete("/message/" + messageId + '/', config)
            .success(function() {
                //alert("deleted: " + messageId);
            }).error(function() {
                alert("delete failed!");
            });
        //TODO remove message with messageId from $scope.messages
    };

    $scope.postMessage = function(issueId, newMessageText) {
        //alert(issueId + ": " + newMessageText);
        var config = {headers: { 'Content-Type': 'application/x-www-form-urlencoded'}};
        $http.post("/issue/" + issueId + "/messages/", "messagefield="+encodeURIComponent(newMessageText), config).success(function(response) {
            //TODO show loading icon
            alert("POST TOIMII");
            $scope.latestMessage = Date.parse(response.created);
            $scope.messages.push(response);
            //$scope.$apply();

        }).error(function(){
            alert("Post doesn't work");
        });


        //$scope.messages.push({text: newMessageText, poster: 'dynamic', time: timeStamp() });

    };

    $scope.getMessages = function(issueID) {
        $http.get("/issue/"+ issueID +"/messages/").success(function(response) {
            console.log(response);
            var messages = response.messages;
            if (messages.length == 0) {
                $scope.latestMessage = 'undefined';
                $scope.firstMessage = 'undefined';
                $scope.messages = [];
                return;
            }
            $scope.latestMessage = messages[0];
            $scope.firstMessage = messages[0];
            var first = Date.parse(messages[0].created);
            var last = Date.parse(messages[0].created);
            for (message of messages) {
                var created = Date.parse(message.created);
                if (created >= last) {
                    $scope.latestMessage = created;
                    last = created;
                }
                if (created <= first) {
                    $scope.firstMessage = created;
                    first = created;
                }
            }
            $scope.messages = messages;
        }).error(function(foo, bar, baz){
            alert("Error getting messages!");
        });
    }

    $scope.getDecisions = function(issueID) {
        $http.get("/issue/" + issueID + "/decisions/").success(function (response) {
            console.log(response);
            var decisions = response.objects;
            if (decisions.length == 0) {
                $scope.latestDecision = 'undefined';
                $scope.firstDecision = 'undefined';
                $scope.messages = [];
                return;
            }
            $scope.latestDecision = decisions[0];
            $scope.firstDecision = decisions[0];
            var first = Date.parse(decisions[0].origin_last_modified_time);
            var last = Date.parse(decisions[0].origin_last_modified_time);
            for (decision of
            decisions
            )
            {
                var created = Date.parse(decision.origin_last_modified_time);
                if (created >= last) {
                    $scope.latestDecision = created;
                    last = created;
                }
                if (created <= first) {
                    $scope.firstDecision = created;
                    first = created;
                }
            }
            $scope.decisions = decisions;
        }).error(function (foo, bar, baz) {
            alert("Error getting decisions!");
        });
    }


    function getTimeSpan() {
        var span = {}
        if ($scope.latestMessage == 'undefined') {
            span.begin = $scope.firstDecision;
            span.end = $scope.latestDecision;
        } else if ($scope.latestDecision == 'undefined') {
            span.begin = $scope.firstMessage;
            span.end = $scope.latestMessage;
        } else {
            span.begin = $scope.firstMessage < $scope.firstDecision ? $scope.firstMessage : $scope.firstDecision;
            span.end = $scope.latestMessage > $scope.latestDecision ? $scope.latestMessage : $scope.latestDecision;
        }
        return span;
    }

    $scope.getStyle = function(index, timing) {
        var timeStamp = Date.parse(timing);
        var firstAndLast = getTimeSpan();
        var timeSpan = firstAndLast.end - firstAndLast.begin;
        //console.log(timeStamp);
        var position = 0;
        if (timeSpan != 0) {
            position = (timeStamp - firstAndLast.begin) / timeSpan;
        }
        var offset = 4;
        var percentage = position * 92 + offset;
        // console.log(position);
        return {
            'left': percentage + '%'
        }
    };

    $scope.likeMessage = function(message) {
        var config = {headers: { 'Content-Type': 'application/x-www-form-urlencoded'}};
        message.liked = !message.liked;
        if(message.liked) {
            $http.post("/message/" + message.id + "/vote", "value=1", config).success(function(response) {
                message.imagesrc = "../../static/img/thumbs-up-green.png";
            }).error(function(foo, bar, baz) {
                alert("like failed")
            });
        } else {
            $http.delete("/message/" + message.id + "/vote", config).success(function(response) {
                message.imagesrc = "../../static/img/thumbs-up.png";
            }).error(function(foo, bar, baz) {
                alert("unlike failed");
            });
        }
    };
});

app.controller('subController', function($scope, $http) {
    $scope.subscribeIssue = function(issue) {
        issue.subscribed = !issue.subscribed;
        if (issue.subscribed) {
            var config = {headers: { 'Content-Type': 'application/x-www-form-urlencoded'}}
            $http.post("/issue/" + issue.id + "/subscribe", config).success(function(response) {
                issue.imagesrc = "../../static/img/yellowstar.png";
            }).error(function(foo, bar, baz) {
                alert("subscribe failed")
            });
        } else {
            var config = {
                method: 'DELETE',
            };
            $http.delete("/issue/" + issue.id + "/subscribe", config).success(function(response) {
                issue.imagesrc = "../../static/img/graystar.png";
            }).error(function(foo, bar, baz) {
                alert("unsubscribe failed");
            });
        }

    };
});

app.controller('recentController', function($scope, $http) {
    $http.get('/issues/recent/comments').success(function(response){

        $scope.recentlyCommented = response.commented;
        //console.log(response.commented);
        for (i = 0; i < 10; i++) {
            //console.log(i);
            $scope.getNameOfIssue($scope.recentlyCommented[i].issueID, i);
        }
        //console.log($scope.recentlyCommented[0].issueID);
    });

    $scope.getNameOfIssue = function(issueID, i) {
        $http.get('/issue/'+ issueID).success(function(response){
            //console.log(response);
            var issueName = response.jsondetails.subject;
            $scope.recentlyCommented[i].issue = response.jsondetails;
            $scope.recentlyCommented[i].name = issueName;
            //console.log(issueName);
        }).error(function(foo, bar, baz) {
            alert("could not find recent issue");
        });
    }



});

function timeStamp() {

    var now = new Date();
    var date = [ now.getDate(), now.getMonth() + 1, now.getFullYear() ];
    var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];

// If seconds and minutes are less than 10, add a zero
    for ( var i = 1; i < 3; i++ ) {
        if ( time[i] < 10 ) {
            time[i] = "0" + time[i];
        }
    }

    return date.join(".") + " " + time.join(":");
}

app.controller('textSearchController', function($scope, $http){
    $scope.textSearch = function(text) {

        console.log("test");
        var config = {
            'params' : {
                'search': text,
                'format': 'json',
            },
        };
        $http.get("/issues/text/", config)
            .then(function(searchResult) {
                var resultController = document.querySelector('[ng-controller="searchResultController"]');
                var resultScope = angular.element(resultController).scope();
                resultScope.searchText.value = searchResult.config.params.search;
                resultScope.searchResults = searchResult.data.objects;
            });
    }
});

app.controller('searchController', function($scope, $http, $timeout){
    $http.get('/user/subscriptions').success(function(response) {
        $scope.subscriptions = response.subscriptions;
        console.log($scope.subscriptions);
    }).error(function(){
        alert('ei saa tilauksia');
    });
    $scope.MapOptions = {
        markers: {
            selected: {},
        },
        mapTypeControl: false,
        mapTypeControlOptions: { mapTypeIds: [] },

    };

    $scope.map = {
        center: {
            latitude: 60.1728365,
            longitude: 24.9399135,
        },
        zoom: 13,
        options: $scope.MapOptions,
        window: {
            marker: {},
            show: false,
            closeClick: function(){
                this.show = false;
            },
            options: {
                maxWidth: 200,
                pixelOffset: {
                    height: -30,
                    width: 0,
                }
            },


            issue: {},
        }
    }

    $scope.map.mapEvents = {};
    var markerRefreshPromise;
    $scope.map.mapEvents.bounds_changed = function (map, eventName, args) {
        // reset the update timer by canceling the last call
        if (markerRefreshPromise != undefined) {
            $timeout.cancel(markerRefreshPromise);
        }
        var waitTime = 500;
        // schedule marker refresh to start in 500 ms (waitTime)
        markerRefreshPromise = $timeout($scope.setMarkers, waitTime, false, map.getBounds());
    };

    $scope.issueMarkers = [];

    $scope.templateUrl = {};

    $scope.content = {};

    $scope.markerClick = function (generated, event, marker){
        console.log(marker);
        $scope.MapOptions.markers.selected = marker;
        var issueId = marker.issue.id;

        // console.log($scope.MapOptions.markers.selected.coords);
        //document.location.href = '/issue/' + issueId;
        $scope.map.window.marker = marker;
        $scope.map.window.issue = marker.issue;
        // console.log(marker.coords);
        //   console.log($scope.window.marker.coords);
        //   $scope.content = '<a href ="/issue/' + issueId +'">' + marker.issue.subject + '</a>';
        /* var link = document.createElement('a');
         link.setAttribute('href',"/issue/" + issueId);
         link.innerHTML = marker.issue.subject;*/
        $scope.templateUrl = '/static/infowindow.html';
        $scope.content = marker.issue;
        console.log($scope.content);
        $scope.map.window.show = !$scope.map.window.show;

        $scope.$apply();
    };

    function addMarkers(issue, index, array) {
        var latLong = issue.geometries[0].coordinates;
        var marker = new google.maps.Marker ({
            // map: $scope.map,
            id: issue.id,
            latitude: latLong[1],
            longitude: latLong[0],
            issue: issue,
            coords: latLong,
            show: false,
        });
        if ($scope.subscriptions.indexOf(marker.id) > -1){
            marker.setIcon('static/img/marker-blue.png');
            issue.subscribed = true;
        } else {
            marker.setIcon('static/img/marker-orange.png');
        }
        $scope.issueMarkers.push(marker);
    }

    var markersUpdating = false;
    $scope.setMarkers = function(bounds) {
        var config = {
            'params' : {
                'minLat': bounds.getSouthWest().lat().toFixed(3),
                'maxLat': bounds.getNorthEast().lat().toFixed(3),
                'minLong': bounds.getSouthWest().lng().toFixed(3),
                'maxLong': bounds.getNorthEast().lng().toFixed(3),
                'format': 'json',
                'page' : 1,
                'pageSize' : 50,
            },
        };
        if ($scope.category != "0" && $scope.category != undefined) {
            config.params.category = $scope.category;
        }

        function loadData(config, initial, semaphore) {
            $http.get("/issues/area", config)
                .success(function (searchResult) {
                    // stop updating if new query has been started
                    if(semaphore.stop) {
                        return;
                    }
                    // clear markers when first page is received
                    if (initial) {
                        $scope.issueMarkers.length = 0;
                    }
                    searchResult.objects.forEach(addMarkers);
                    // read paging metadata from response
                    var pageSize = searchResult.meta.limit;
                    var page = searchResult.meta.page;
                    var total = searchResult.meta.total_count;
                    var pages = total / pageSize;
                    // load next page if available
                    if (page < pages && !semaphore.stop && page < 4) {
                        config.params.page = page+1;
                        loadData(config, false, semaphore);
                    } else {
                        // update loading status
                        semaphore.markersUpdating = false;
                    }
                }).error(function (data, status, headers, config) {
                    console.log("error")
                    semaphore.markersUpdating = false;
                });
        }
        // cancel previous marker request
        if ($scope.previousRequestSemapahore != undefined) {
            $scope.previousRequestSemapahore.stop = true;
        }
        var semaphore = {stop: false, markersUpdating: true};
        loadData(config, true, semaphore);
        $scope.previousRequestSemaphore = semaphore;
    }

    $scope.closeClick = function() {
        $scope.map.window.show = false;
    };


});

app.controller('windowController', function($scope, $http) {
    var issueController = document.querySelector('[ng-controller="messageController"]');
    var issueScope = angular.element(issueController).scope();

    $scope.windowClick = function (issue) {
        issueScope.showIssue = true;
        issueScope.issueID = issue.id;
        issueScope.issue = issue;
        console.log(issue);
        console.log("täällä! showIssue: " + issueScope.showIssue);
    }
    $scope.$watch("issue", function (newVal, oldVal) {
        if( newVal === undefined) {
            return;
        }
        var issueID = newVal.id;
        $http.get("/issue/" + issueID + "/messages/").success(function (response) {
            console.log(response);
            var messages = response.messages;
            $scope.messages = messages;
            if (messages.length > 0) {
                $scope.lastMessage = messages[messages.length - 1];
            } else {
                $scope.lastMessage = undefined;
            }
        }).error(function(err) {
            alert(err);
        });
    });
});

app.controller('loginController', function($scope){
    var loginbutton = document.querySelector('[ng-controller="loginShowController"]');
    var loginscope = angular.element(loginbutton).scope();

    $scope.toggleShow = function() {
        loginscope.toggleShow();
    }

});

app.controller('loginShowController', function($scope, $rootScope){
    $scope.inputClick = false;

    $scope.toggleShow = function() {
        if($scope.inputClick) {
            $scope.inputClick = false;
            return;
        }
        else {
            $rootScope.showLogin = !$rootScope.showLogin;
        }
    }
});

app.controller('templateController', function(){});

app.controller('closeController', function($scope){
    var controller = document.querySelector('[ng-controller="messageController"]');
    var topscope = angular.element(controller).scope();

    $scope.closeIssue = function() {
        console.log('ruksia klikattiin');
        topscope.showIssue = false;
    }
});

app.controller('profileController', function($scope, $http, UserData) {
    $scope.userData = UserData;
    console.log($scope.userData.showProfile);

    $http.get("/user/").success(function(response){
        $scope.user = response;
    }).error(function(foo, bar, baz){
        //alert("User not found");
    });
});

app.controller('profileNavController', function($scope, $http, UserData){
    //profileScope.showProfile = false;
    $scope.userData = UserData;
    $http.get("/user/").success(function(response){
        $scope.user = response;
        //$scope.getPicture($scope.user.id);
    }).error(function(foo, bar, baz){
        alert("User not found");
    });

    $scope.getPicture = function(userId) {
        $http.get("/user/" + userId + "/picture").success(function (response) {
            //console.log(response);
            $scope.user.picture = response;

        }).error(function (foo, bar, baz) {
            alert("Error getting profile pic!");
        });
    }

    $scope.toggleShow = function() {
        console.log(UserData.showProfile);
        $scope.userData.showProfile = true;
    }

});

app.controller('closeProfileController', function($scope, UserData){
    $scope.closeProfile = function() {
        //console.log('ruksia klikattiin');
        UserData.showProfile = !UserData.showProfile;
    }
});

app.controller('subscriptionController', function($scope){
    var controller = document.querySelector('[ng-controller="searchController"]');
    var topScope = angular.element(controller).scope();

    console.log(topScope.subscriptions);
});











