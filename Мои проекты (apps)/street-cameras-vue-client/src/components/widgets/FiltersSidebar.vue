<template>
	<div class="filter-sidebar" :class="{ '_opened': isVisible }">
		<div class="filter-sidebar__close" role="button" @click="$emit('close')">
			<i class="bi bi-arrow-left-circle"></i>
		</div>

		<div class="filters">
			<div class="filters-block">
				<h4>Местоположение</h4>
				<div class="filters-block__items">
					<div
						class="filter-category"
						:class="{ '_active': ~filters.regions.indexOf(regionIndex) }"
						role="button"
						v-for="(region, regionIndex) in places"
						:key="regionIndex"
						@click="filter('regions', regionIndex)"
					>
						<span>{{ regionIndex }}</span>

						<div
							class="filter-item"
							v-for="(city, cityIndex) in region"
							:key="cityIndex"
							v-show="~filters.regions.indexOf(regionIndex)"
							@click.stop="filter('cities', city)"
						>
							<span class="filter-title">{{ city }}</span>

							<div class="filter-check d-flex" v-if="~filters.cities.indexOf(city)">
								<span class="filter-delimiter"></span>
								<i class="bi bi-check-square"></i>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="filters-block">
				<h4>Категория</h4>
				<div class="filters-block__items">
					<div
						class="filter-item"
						role="button"
						v-for="(tag, index) in $store.getters.tags"
						:key="index"
						@click="filter('tags', tag)"
					>
						<span class="filter-title">{{ tag }}</span>

						<div class="filter-check d-flex" v-if="~filters.tags.indexOf(tag)">
							<span class="filter-delimiter"></span>
							<i class="bi bi-check-square"></i>
						</div>
					</div>
				</div>
			</div>
			<div class="filters-block" v-if="$store.getters.isAuth">
				<h4>Тип</h4>
				<div class="filters-block__items">
					<div
						class="filter-item"
						role="button"
						v-for="type in types"
						:key="type.id"
						@click="filter('types', type.id)"
					>
						<span class="filter-title">{{ type.label }}</span>

						<div class="filter-check d-flex" v-if="~filters.types.indexOf(type.id)">
							<span class="filter-delimiter"></span>
							<i class="bi bi-check-square"></i>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="filter-substrate" @click.stop="$emit('close')" v-if="isVisible"></div>
	</div>
</template>

<script>
  export default {
    name: 'FiltersSidebar',

	  props: {
      isVisible: {
        type: Boolean,
	      required: true,
      }
	  },

	  data: () => ({
		  filters: {
		    regions: [],
			  cities: [],
			  tags: [],
			  types: [],
		  },
      types: [
        { id: 'Публичная', label: 'Публичные' },
        { id: 'Дворовая', label: 'Дворовые' },
        { id: 'Личная', label: 'Личные' },
      ],
	  }),

	  computed: {
      places() {
        let places = {};

        for (const camera of this.$store.getters.cameras) {
          if (!places[camera.Address.Region]) {
            places[camera.Address.Region] = [];
          }
          if (!~places[camera.Address.Region].indexOf(camera.Address.City)) {
            places[camera.Address.Region].push(camera.Address.City);
          }
        }

        for (const region in places) {
          places[region] = places[region].sort();
        }

        return places;
      },
	  },

	  methods: {
      filter(category, value) {
        if (~this.filters[category].indexOf(value)) {
          this.filters[category] = this.filters[category].filter(region => region !== value);
        } else {
          this.filters[category].push(value);
        }

        this.$store.commit('SET_CAMERAS_FILTERS', this.filters);
      },
	  },
    
    updated() {
      const storedFilters = this.$store.getters.filters;
      
      for (const filter of ['regions', 'cities', 'tags', 'types']) {
        if (storedFilters[filter]) {
          this.filters[filter] = storedFilters[filter];
        }
      }
    },
  };
</script>

<style lang="less" scoped>
	.filter-sidebar {
		@leftShift: 32vw;
		position: fixed;
		left: -@leftShift;
		top: 0;
		bottom: 0;
		background-color: #121212;
		width: @leftShift;
		transition: left .2s ease-in-out;
    z-index: 5;

		.filter-substrate {
			position: fixed;
			top: 0;
			bottom: 0;
			left: @leftShift;
			right: 0;
		}

		&._opened {
			left: 0;
		}

		.filters {
			padding: 2rem 3.5rem 2rem 2rem;
			max-height: 100%;
			overflow-y: auto;
			color: #fff;

			&::-webkit-scrollbar {
				width: 5px;
			}

			&::-webkit-scrollbar-track {
				background-color: darkgrey;
			}

			&::-webkit-scrollbar-thumb {
				box-shadow: inset 0 0 6px #000;
			}

			&-block {
				margin-bottom: 1rem;
				font-size: 18px;

				&__items {
					padding-top: 1px;

					.filter-item, .filter-category {
						padding: 3px 0 3px 1rem;
						margin: 5px 0;

						&:last-child {
							margin-bottom: 0;
						}
					}

					.filter-category {
						&._active > span {
							text-decoration: underline;
						}
					}

					.filter-item {
						display: flex;
					}

					.filter-check {
						flex: 1;
					}

					.filter-delimiter {
						flex: 1;
						border-bottom: dotted 1px #fff;
						margin: 0 5px 6px;
					}
				}
			}
		}

		&__close {
			position: absolute;
			right: 1rem;
			top: 10px;
			color: #fff;
			font-size: 32px;
		}
	}

	@media screen and (max-width: 1020px) {
		.filter-sidebar {
			@leftShiftMobile: 90vw;
			left: -@leftShiftMobile;
			width: @leftShiftMobile;

			.filter-substrate {
				left: @leftShiftMobile;
			}

			.filters {
				padding: 1rem 3rem 1rem 1rem;

				&-block {
					font-size: 16px;
				}
			}
		}
	}
</style>