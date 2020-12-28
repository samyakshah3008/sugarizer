// Rebase require directory
requirejs.config({
	baseUrl: "lib",
	paths: {
		activity: "../js"
	}
});

// Initial sequence
// -- [] to iterate on existing icons
// -- ["id1", "id2"]
const initIconsSequences = [[], ["org.sugarlabs.Falabracman"], ["com.homegrownapps.reflection", "org.sugarlabs.FractionBounce"]]
const initIcons = initIconsSequences[1];
// -- [] to iterate on all colors
// -- [color1, color2] use -1 for random color
const initColorsSequences = [[], [-1], [22, 47, 65], [256, 100], [256, 256, 256, 47, 256, 256, 256, 47, 256, 256, 256, 47, 256, 256, 256, 47], [65]];
const initColors = initColorsSequences[2];
const initSize = 60;
const minSize = 30;
const maxSize = 90;
const initBlinkTime = 1000;
const initMessageContent = "Merry\nChristmas!";
const initMessageColor = "#000000";
const initMessageSize = 80;
const viewGrid = 1;
const viewDetail = 2;

// Vue main app
var app = new Vue({
	el: '#app',
	data: {
		currentView: viewGrid,
		activitiesIcons: [],
		gridContent: [],
		detailContent: {
			dropIcons: [],
			dragIcons: []
		},
		size: initSize,
		blinkTime: initBlinkTime,
		message: initMessageContent,
		messageStyle: {
			color: initMessageColor,
			fontWeight: 'normal',
			fontStyle: 'normal',
			size: initMessageSize
		},
		interval: null,
		paused: false,
		SugarL10n: null,
		l10n: {
			stringUnfullscreen: "",
			stringFullscreen: "",
			stringSettings: "",
			stringSpeed: "",
			stringZoom: "",
			stringText: "",
			stringPlay: "",
			stringPause: "",
			stringDragIcons: ""
		}
	},

	mounted() {
		this.SugarL10n = this.$refs.SugarL10n;
	},

	created() {
		let vm = this;

		// Load activities list
		_loadActivities().then(function(activities) {
			// Load an convert to pure SVG each icon
			let len = activities.length;
			for (let i = 0 ; i < len ; i++) {
				let activity = activities[i];
				_loadAndConvertIcon("../../"+activity.directory+"/"+activity.icon).then(function(svg) {
					vm.activitiesIcons[activity.id] = svg;
					if (Object.keys(vm.activitiesIcons).length == len) {
						vm.generateGrid();
						vm.blink();
					}
				});
			}
		});

		// Resize dynamically grid
		let message = document.getElementById("message");
		var computeHeight = function() {
			document.getElementById("grid").style.height = (document.getElementById("body").offsetHeight-(vm.$refs.SugarToolbar&&vm.$refs.SugarToolbar.isHidden()?0:55))+"px";
			if (vm.message.length) {
				message.innerText = vm.message;
				message.style.color = vm.messageStyle.color;
				message.style.fontWeight = vm.messageStyle.fontWeight;
				message.style.fontStyle = vm.messageStyle.fontStyle;
				message.style.fontSize = vm.messageStyle.size+"pt";
				message.style.visibility = "visible";
			}
			if (Object.keys(vm.activitiesIcons).length > 0) {
				if (vm.interval) {
					clearInterval(vm.interval);
					vm.interval = null;
				}
				vm.generateGrid();
				vm.blink();
			}
		}
		computeHeight();
		window.addEventListener("resize", computeHeight);
	},

	methods: {
		// Localize strings
		localized: function() {
			let vm = this;
			vm.SugarL10n.localize(vm.l10n);
		},

		// Generate a grid using icons and colors sequence
		generateGrid: function() {
			let vm = this;
			vm.gridContent = [];
			let height = document.getElementById("body").offsetHeight-(vm.$refs.SugarToolbar.isHidden()?0:55);
			let width = document.getElementById("body").offsetWidth;
			let total = Math.floor((1.0*height)/vm.size)*Math.floor((1.0*width)/vm.size);
			let count = total/Object.keys(vm.activitiesIcons).length;
			for (var i = 0 ; i < count ; i++) {
				Object.keys(vm.activitiesIcons).forEach(function(id) {
					let index = vm.gridContent.length;
					let current = (initIcons.length==0?id:initIcons[index%initIcons.length]);
					let svg = vm.activitiesIcons[current];
					let color = (initColors.length==0?index%180:initColors[index%initColors.length]);
					if (color == -1) { color = Math.floor(Math.random()*180) }
					let size = vm.size;
					vm.gridContent.push({
						name: id,
						svg: svg,
						color: color,
						size: size,
						step: (initColors.length==0?0:index%initColors.length)
					});
				});
			}
		},

		// Blink icons
		blink: function() {
			let vm = this;
			vm.interval = setInterval(function() {
				if (vm.paused) {
					return;
				}
				for (let i = 0 ; i < vm.gridContent.length ; i++) {
					let newColor;
					if (initColors.length == 0) {
						newColor = (vm.gridContent[i].color+1)%180;
					} else {
						vm.gridContent[i].step = (vm.gridContent[i].step + 1)%initColors.length;
						newColor = initColors[vm.gridContent[i].step];
					}
					if (newColor == -1) { newColor = Math.floor(Math.random()*180) }
					vm.gridContent[i].color = newColor;
				}
			}, vm.blinkTime);
		},

		// Click on play/pause button
		onPlayPause: function() {
			let vm = this;
			vm.paused = !vm.paused;
			document.getElementById("playpause-button").style.backgroundImage = (vm.paused ? "url(icons/play.svg)" : "url(icons/pause.svg)");
			document.getElementById("playpause-button").title = (vm.paused ? vm.l10n.stringPlay : vm.l10n.stringPause);
		},

		// Click on settings button
		onSettingsClicked: function() {
			let vm = this;
			vm.currentView = (vm.currentView == viewGrid ? viewDetail : viewGrid);
			if (vm.currentView == viewDetail) {
				vm.detailContent.dropIcons = [];
				for (let i = 0 ; i < initIcons.length ; i++) {
					vm.detailContent.dropIcons.push({
						name: initIcons[i],
						svg: vm.activitiesIcons[initIcons[i]],
						color: 512,
						size: 40
					});
				}
				vm.detailContent.dragIcons = [];
				let keys = Object.keys(vm.activitiesIcons);
				for (let i = 0 ; i < keys.length ; i++) {
					vm.detailContent.dragIcons.push({
						name: keys[i],
						svg: vm.activitiesIcons[keys[i]],
						color: 512,
						size: 40
					});
				}
			}
		},

		// Handle zoom change
		onZoomChanged: function(event) {
			let vm = this;
			let zoom = event.detail.zoom;
			let oldSize = vm.size;
			let newSize = oldSize;
			if (zoom == 2) {
				newSize = initSize;
			} else if (zoom == 0) {
				newSize = Math.max(minSize, oldSize-10);
			} else if (zoom == 1) {
				newSize = Math.min(maxSize, oldSize+10);
			}
			if (newSize != oldSize) {
				vm.size = newSize;
				vm.generateGrid();
			}
		},

		// Handle text change
		onTextChanged: function(event) {
			let vm = this;
			let message = document.getElementById("message");
			message.innerText = vm.message = event.detail.value;
			message.style.color = vm.messageStyle.color = event.detail.color;
			message.style.fontWeight = vm.messageStyle.fontWeight = event.detail.fontWeight;
			message.style.fontStyle = vm.messageStyle.fontStyle = event.detail.fontStyle;
			vm.messageStyle.size = event.detail.size;
			message.style.fontSize = vm.messageStyle.size+"pt";
		},

		// Handle speed change
		onSpeedChanged: function(event) {
			let vm = this;
			if (vm.interval) {
				clearInterval(vm.interval);
				vm.interval = null;
			}
			vm.blinkTime = 500+(event.detail.speed*10);
			vm.blink();
		},

		//  Handle fullscreen/unfullscreen
		fullscreen: function () {
			this.$refs.SugarToolbar.hide();
			this.generateGrid();
		},

		unfullscreen: function () {
			this.$refs.SugarToolbar.show();
			this.generateGrid();
		}
	}
});

// Load activities
function _loadActivities() {
	return new Promise(function(resolve, reject) {
		axios.get('../../activities.json').then(function(response) {
			resolve(response.data);
		}).catch(function(error) {
			reject(error);
 		});
	});
}

// Need to create an unique id for each embedded SVG
let idCount = 1;

// Load icon and convert it to a pure SVG (remove Sugar stuff)
function _loadAndConvertIcon(url) {
	return new Promise(function(resolve, reject) {
		axios.get(url).then(function(response) {
			// Remove ENTITY HEADER
			let read = response.data;
			var buf = read.replace(/<!DOCTYPE[\s\S.]*\]>/g,"");

			// Replace &fill_color; and &stroke_color;
			buf = buf.replace(/&stroke_color;/g,"var(--stroke-color)");
			buf = buf.replace(/&fill_color;/g,"var(--fill-color)");

			// Add symbol and /symbol
			buf = buf.replace(/(<svg[^>]*>)/g,'$1<symbol id="icon'+idCount+'">');
			buf = buf.replace(/(<\/svg>)/g,'</symbol><use xlink:href="#icon'+idCount+'" href="#icon'+idCount+'"/>$1');
			idCount++;

			resolve(buf);
		}).catch(function(error) {
			reject(error);
 		});
	});
}
