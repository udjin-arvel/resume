<template>
	<div class="dialog-modal cities-modal">
		<div class="modal-close" @click="$emit('closeModal')" role="button">&times;</div>
		<h4>Доступные камеры:</h4>

		<div class="cameras-list mb-3">
			<div class="region form-check" v-for="(region, rI) in inputs" :key="rI">
				<span class="icon"><i class="bi bi-globe-central-south-asia"></i></span>
				<input class="form-check-input" type="checkbox" :value="rI" @input="selectRegion($event, rI)">
				<label class="form-check-label" role="button" @click="expandRegion(rI)">{{ rI }}</label>

				<div class="city form-check" v-for="(city, cI) in region" :key="cI" v-show="~regions.indexOf(rI)">
					<span class="icon"><i class="bi bi-buildings-fill"></i></span>
					<input class="form-check-input" type="checkbox" v-model="cities" :value="cI" @input="selectCity($event, rI, cI)">
					<label class="form-check-label" role="button" @click="expandCity(cI)">{{ cI }}</label>

					<div class="camera form-check" v-for="camera in city" :key="camera.Id" v-show="~openedCities.indexOf(cI)">
						<span class="icon"><i class="bi bi-camera-fill"></i></span>
						<input
							class="form-check-input"
							type="checkbox"
							v-model="cameras"
							:id="camera.Id"
							:value="camera.Id"
						>
						<label class="form-check-label" :for="camera.Id" role="button">{{ camera.Name }}</label>
					</div>
				</div>
			</div>
		</div>

		<div class="cities-modal__button">
			<button type="button" class="btn btn-primary w-100" @click="submitCameras">Выбрать камеры</button>
		</div>
	</div>
</template>

<script>
  export default {
    name: 'CitiesModal',

	  data: () => ({
		  cameras: [],
      regions: [],
		  cities: [],
		  openedCities: [],
	  }),
	  
	  methods: {
      submitCameras() {
        this.$store.commit('ADD_MY_CAMERAS', this.cameras);
        this.$emit('closeModal');
      },
      selectRegion({ target }, region) {
        const regionCities = Object.keys(this.inputs[region]);
        const regionCameras = this.$store.getters.cameras
	        .filter(camera => camera.Address.Region === region)
	        .map(camera => camera.Id);

        if (target.checked) {
          this.cameras = this.cameras.concat(regionCameras);
          this.cities = this.cities.concat(regionCities);
        } else {
          this.cameras = this.cameras.filter(camera => !~regionCameras.indexOf(camera));
          this.cities = this.cities.filter(city => !~regionCities.indexOf(city))
        }
      },
      selectCity({ target }, region, city) {
        const cityCameras = Object.values(this.inputs[region][city]).map(camera => camera.Id);

        if (target.checked) {
          this.cameras = this.cameras.concat(cityCameras);
          this.cities.push(city);
        } else {
          this.cameras = this.cameras.filter(camera => !~cityCameras.indexOf(camera));
          this.cities = this.cities.filter(c => c !== city);
        }
      },
      expandRegion(region) {
        if (~this.regions.indexOf(region)) {
          this.regions = this.regions.filter(r => r !== region);
        } else {
          this.regions.push(region);
        }
      },
      expandCity(city) {
        if (~this.openedCities.indexOf(city)) {
          this.openedCities = this.openedCities.filter(c => c !== city);
        } else {
          this.openedCities.push(city);
        }
      },
	  },

	  computed: {
      inputs() {
        let inputs = {};

        for (const camera of this.$store.getters.cameras) {
          if (!inputs[camera.Address.Region]) {
            inputs[camera.Address.Region] = {};
          }
          if (!inputs[camera.Address.Region][camera.Address.City]) {
            inputs[camera.Address.Region][camera.Address.City] = [];
          }

          inputs[camera.Address.Region][camera.Address.City].push(camera);
        }
        
        for (const region in inputs) {
          inputs[region] = Object.keys(inputs[region])
	          .sort()
	          .reduce(
	            (obj, key) => {
	              obj[key] = inputs[region][key];
	              return obj;
	            }, {});
        }

        return inputs;
		  },
	  },

	  mounted() {
      this.cameras = this.$store.getters.myCamerasIds;
	  },
  };
</script>

<style lang="less" scoped>
	.cities-modal {
		position: relative;
		width: 40vw;
		height: 80vh;
		margin: 10vh auto;

		.cameras-list {
			height: 64vh;
			overflow-y: auto;
			padding-left: 4px;

			.icon {
				padding-right: 6px;
			}

			.region, .city, .camera {
				margin: 10px 0;
			}

			.camera {
				label {
					display: inline;
				}
			}
		}

		.modal-close {
			position: absolute;
			top: 1px;
			right: 1rem;
			font-size: 32px;
		}
	}

	@media screen and (max-width: 1020px) {
		.cities-modal {
			width: 90vw;
			height: 84vh;

			.cameras-list {
				padding-right: 10px;
			}
		}
	}
</style>
