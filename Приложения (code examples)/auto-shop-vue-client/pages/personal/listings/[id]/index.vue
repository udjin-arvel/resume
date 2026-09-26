<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <Header />

      <CommonAlert
        v-if="alert"
        :alert="alert"
        :class="$style.alert"
      />

      <div :class="$style.mainBlock">
        <div :class="$style.leftColumn">
          <section :class="$style.panel">
            <div :class="$style.panelHeader">
              <span :class="$style.panelStep">1</span>
              <div :class="$style.panelHeaderText">
                <h2 :class="$style.panelTitle">
                  {{ t("listing.panel_publication") }}
                </h2>
                <p :class="$style.panelDesc">
                  {{ t("listing.panel_publication_desc") }}
                </p>
              </div>
            </div>
            <div :class="$style.panelBody">
              <div :class="$style.optionsBlock">
                <div :class="$style.optionsLeft">
                  <ClientOnly>
                    <Switch
                      v-model="listingData.shownOnSite"
                      :class="$style.activitySwitch"
                      :disabled="isFormDisabled"
                      @input="alert = null"
                      @update:model-value="errors.clear('shownOnSite')"
                    />
                  </ClientOnly>
                  <span :class="$style.optionsLabel">{{
                    t("listing.shown_on_site")
                  }}</span>
                </div>
                <span
                  :class="[
                    $style.statusBadge,
                    listingData.shownOnSite ? $style.statusBadgeOn : $style.statusBadgeOff,
                  ]"
                >
                  {{ listingData.shownOnSite ? t("listing.published_badge") : t("listing.hidden_badge") }}
                </span>
              </div>
              <div :class="$style.fieldsGrid">
                <Select
                  v-model="listingData.accessOption"
                  :options="accessOptions"
                  :label="t('listing.access_option')"
                  :class="$style.infoBox"
                  :disabled="isFormDisabled"
                  :invalid-message="errors.get('accessOption')"
                  required
                  @input="alert = null"
                  @update:model-value="errors.clear('accessOption')"
                />
                <Select
                  v-model="listingData.userId"
                  :options="managerOptions"
                  :label="t('listing.manager')"
                  :class="$style.infoBox"
                  :disabled="isFormDisabled"
                  required
                  :invalid-message="errors.get('userId')"
                  @input="alert = null"
                  @update:model-value="errors.clear('userId')"
                />
                <SearchableSelect
                  v-model="selectedRequests"
                  :options="requestOptions"
                  :label="`${t('listing.add_car_to_request')}`"
                  :placeholder="t('listing.request_placeholder')"
                  :class="$style.infoBox"
                  :multiple="true"
                  :disabled="isFormDisabled"
                  :invalid-message="errors.get('selectedInfoRequest')"
                  :default-to-first-option="false"
                  @input="alert = null"
                  @update:model-value="errors.clear('selectedInfoRequest')"
                />

                <div
                  v-if="hasNewRequests"
                  :class="$style.requestWarning"
                >
                  <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
                  {{ t('needs.take_request_to_work_first') }}
                </div>
                <div
                  v-if="listingData.selectedInfoRequest && listingData.selectedInfoRequest.length > 0"
                  :class="$style.selectedRequestsList"
                >
                  <div
                    v-for="req in listingData.selectedInfoRequest"
                    :key="req.value"
                    :class="$style.selectedRequestItem"
                  >
                    <span>{{ req.name }}</span>
                    <button
                      type="button"
                      :class="$style.removeRequestBtn"
                      :disabled="isRequestBindingLocked(req) || isFormDisabled"
                      :title="isRequestBindingLocked(req) ? t('needs.booking_action_blocked') : undefined"
                      @click="removeRequest(req)"
                    >
                      <XMarkIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            v-if="isCreate"
            :class="$style.panel"
          >
            <div :class="$style.panelHeader">
              <span :class="$style.panelStep">2</span>
              <div :class="$style.panelHeaderText">
                <h2 :class="$style.panelTitle">
                  {{ t("listing.quick_import") }}
                </h2>
                <p :class="$style.panelDesc">
                  {{ t("listing.import_description") }}
                </p>
              </div>
            </div>
            <div :class="$style.panelBody">
              <div :class="$style.importBlock">
                <p
                  v-if="carLinkId"
                  :class="$style.carLinkNotice"
                >
                  {{ t('listing.car_link_notice', { id: carLinkId }) }}
                </p>
                <Input
                  v-model="importUrl"
                  :label="t('listing.import_from_url')"
                  :placeholder="t('listing.import_url_placeholder')"
                  :disabled="isImporting"
                  :invalid-message="importError"
                />
                <div class="flex flex-wrap items-center gap-3 mt-2.5">
                  <CommonButton
                    type="button"
                    kind="blue"
                    :disabled="!importUrl || isImporting"
                    @click="handleImport(false)"
                  >
                    {{ isImporting ? t('listing.importing') : t('listing.start_import') }}
                  </CommonButton>

                  <CommonButton
                    type="button"
                    kind="blue"
                    :disabled="!importUrl || isImporting"
                    @click="handleImport(true)"
                  >
                    {{ t('listing.start_import_with_photos') }}
                  </CommonButton>

                  <CommonButton
                    v-if="isImporting"
                    type="button"
                    kind="primary"
                    @click="handleCancelImport"
                  >
                    {{ t('listing.cancel_import') }}
                  </CommonButton>
                  <span
                    v-if="!isImporting"
                    :class="$style.importHint"
                  >
                    {{ t('listing.import_supported') }}
                  </span>
                </div>

                <div
                  v-if="isImporting"
                  :class="$style.progressBar"
                >
                  <div
                    :class="$style.progressFill"
                    :style="{ width: `${importProgress}%` }"
                  />
                  <span :class="$style.progressText">{{ importMessage }}</span>
                </div>
              </div>
            </div>
          </section>

          <section :class="$style.panel">
            <div :class="$style.panelHeader">
              <span :class="$style.panelStep">{{ isCreate ? 3 : 2 }}</span>
              <div :class="$style.panelHeaderText">
                <h2 :class="$style.panelTitle">
                  {{ t("listing.panel_characteristics") }}
                </h2>
                <p :class="$style.panelDesc">
                  {{ t("listing.panel_characteristics_desc") }}
                </p>
              </div>
            </div>
            <div :class="$style.panelBody">
              <div :class="$style.fieldsGrid">
                <div :class="$style.infoRow">
                  <Input
                    v-model="listingData.vin"
                    :class="$style.infoSubBox"
                    label="VIN *"
                    maxlength="17"
                    :disabled="isFormDisabled"
                    :invalid-message="errors.get('vin')"
                    :status="vinCheckStatus === 'available' ? 'success' : vinCheckStatus === 'exists' ? 'error' : null"
                    @input="alert = null"
                    @update:model-value="onVinUpdate"
                    @blur="handleVinBlur"
                  />
                  <InputNumber
                    v-model="listingData.mileage"
                    :class="$style.infoSubBox"
                    :label="`${t('listing.mileage')}  *`"
                    :disabled="isFormDisabled"
                    :invalid-message="errors.get('mileage')"
                    thousands-separated
                    required
                    @input="alert = null"
                    @update:model-value="errors.clear('mileage')"
                  />
                </div>
                <div :class="$style.infoRow">
                  <SearchableSelect
                    v-model="listingData.brand"
                    :options="sortedBrands"
                    :label="t('listing.brand')"
                    :class="$style.infoSubBox"
                    :disabled="isFormDisabled"
                    :invalid-message="errors.get('brand')"
                    @input="alert = null"
                    @update:model-value="errors.clear('brand')"
                  />
                  <SearchableSelect
                    v-model="listingData.series"
                    :options="series"
                    :label="t('listing.model')"
                    :class="$style.infoSubBox"
                    :disabled="isFormDisabled"
                    :invalid-message="errors.get('model')"
                    @input="alert = null"
                    @update:model-value="errors.clear('model')"
                  />
                  <SearchableSelect
                    v-model="listingData.year"
                    :options="yearOptions"
                    :label="t('listing.complectation_year')"
                    :class="$style.infoSubBox"
                    :disabled="!yearOptions.length || isFormDisabled"
                    :invalid-message="errors.get('year')"
                    @input="alert = null"
                    @update:model-value="errors.clear('year')"
                    @open="ensureYearsLoaded"
                  />
                  <SearchableSelect
                    v-model="listingData.bodyColor"
                    :options="bodyColorOptions"
                    :label="t('listing.body_color')"
                    :class="$style.infoSubBox"
                    :disabled="isFormDisabled"
                    :invalid-message="errors.get('bodyColor')"
                    @input="alert = null"
                    @update:model-value="errors.clear('bodyColor')"
                  />
                </div>
                <div :class="$style.infoBox">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium text-gray-700">{{ t('listing.complectation') }}</span>
                    <span
                      v-if="variantsLoaded && isAllVariantsLoaded"
                      class="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded"
                    >
                      {{ t('listing.variants_available', { count: filteredModelOptions.length }) }}
                    </span>
                  </div>
                  <div class="relative">
                    <SearchableSelect
                      v-model="listingData.model"
                      :options="filteredModelOptions"
                      :label="''"
                      :placeholder="variantsLoaded && isAllVariantsLoaded ? t('listing.variants_available', { count: filteredModelOptions.length }) : t('listing.select_variant')"
                      :disabled="!variantsLoaded || isFormDisabled || filteredModelOptions.length === 0"
                      :invalid-message="errors.get('complectation')"
                      :default-to-first-option="false"
                      @input="alert = null"
                      @update:model-value="onModelChange"
                      @open="ensureVariantsLoaded"
                    />
                    <button
                      v-if="listingData.model"
                      :class="$style.resetFilterCompBtn"
                      @click="listingData.model = undefined"
                    >
                      <XMarkIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div
                  v-if="variantsLoaded"
                  :class="$style.fieldsSubgrid"
                >
                  <div :class="$style.infoRow">
                    <div
                      :class="$style.infoSubBox"
                      class="relative"
                    >
                      <Select
                        v-model="listingData.engineType"
                        :options="availableEngineTypes"
                        :label="t('listing.engine_type')"
                        :disabled="!availableEngineTypes.length || isFormDisabled"
                        :invalid-message="errors.get('engineType')"
                        @input="alert = null"
                        @update:model-value="errors.clear('engineType')"
                      />
                      <button
                        v-if="listingData.engineType && availableEngineTypes.length"
                        type="button"
                        :class="$style.resetFilterBtn"
                        @click="listingData.engineType = ''"
                      >
                        <XMarkIcon class="w-4 h-4" />
                      </button>
                    </div>
                    <div
                      :class="$style.infoSubBox"
                      class="relative"
                    >
                      <Select
                        v-model="listingData.engine"
                        :options="availableEngines"
                        :label="t('listing.engine')"
                        :disabled="!availableEngines.length || isFormDisabled"
                        :invalid-message="errors.get('engine')"
                        @input="alert = null"
                        @update:model-value="errors.clear('engine')"
                      />
                      <button
                        v-if="listingData.engine && availableEngines.length"
                        type="button"
                        :class="$style.resetFilterBtn"
                        @click="listingData.engine = ''"
                      >
                        <XMarkIcon class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div :class="$style.infoRow">
                    <div
                      :class="$style.infoSubBox"
                      class="relative"
                    >
                      <Select
                        v-model="powerSelectModel"
                        :options="availablePowers"
                        :label="t('listing.power')"
                        :disabled="!availablePowers.length || isFormDisabled"
                        :invalid-message="errors.get('power')"
                        @input="alert = null"
                        @update:model-value="errors.clear('power')"
                      />
                      <button
                        v-if="listingData.power && availablePowers.length"
                        type="button"
                        :class="$style.resetFilterBtn"
                        @click="listingData.power = undefined"
                      >
                        <XMarkIcon class="w-4 h-4" />
                      </button>
                    </div>
                    <div
                      :class="$style.infoSubBox"
                      class="relative"
                    >
                      <Select
                        v-model="listingData.transmission"
                        :options="availableTransmissions"
                        :label="t('listing.transmission')"
                        :disabled="!availableTransmissions.length || isFormDisabled"
                        :invalid-message="errors.get('transmission')"
                        @input="alert = null"
                        @update:model-value="errors.clear('transmission')"
                      />
                      <button
                        v-if="listingData.transmission && availableTransmissions.length"
                        type="button"
                        :class="$style.resetFilterBtn"
                        @click="listingData.transmission = ''"
                      >
                        <XMarkIcon class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div :class="$style.infoRow">
                    <div
                      :class="$style.infoSubBox"
                      class="relative"
                    >
                      <Select
                        v-model="listingData.drive"
                        :options="availableDrives"
                        :label="t('listing.drive')"
                        :disabled="!availableDrives.length || isFormDisabled"
                        :invalid-message="errors.get('drive')"
                        @input="alert = null"
                        @update:model-value="errors.clear('drive')"
                      />
                      <button
                        v-if="listingData.drive && availableDrives.length"
                        type="button"
                        :class="$style.resetFilterBtn"
                        @click="listingData.drive = ''"
                      >
                        <XMarkIcon class="w-4 h-4" />
                      </button>
                    </div>
                    <div
                      :class="$style.infoSubBox"
                      class="relative"
                    >
                      <Select
                        v-model="listingData.bodyType"
                        :options="availableBodyTypes"
                        :label="t('listing.body_type')"
                        :disabled="!availableBodyTypes.length || isFormDisabled"
                        :invalid-message="errors.get('bodyType')"
                        @input="alert = null"
                        @update:model-value="errors.clear('bodyType')"
                      />
                      <button
                        v-if="listingData.bodyType && availableBodyTypes.length"
                        type="button"
                        :class="$style.resetFilterBtn"
                        @click="listingData.bodyType = ''"
                      >
                        <XMarkIcon class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div :class="$style.infoRow">
                  <div :class="$style.infoSubBox">
                    <Select
                      v-model="releaseYearStr"
                      :options="releaseYearOptions"
                      :label="t('listing.release_year')"
                      required
                      :placeholder="t('listing.from_plate')"
                      :disabled="isFormDisabled || !isModelSelected || releaseYearMatchesComplectation"
                      :invalid-message="errors.get('releaseYear')"
                      @input="alert = null"
                      @update:model-value="errors.clear('releaseYear')"
                    >
                      <template #label-extra>
                        <TooltipIcon
                          :icon="ExclamationCircleIcon"
                          :tooltip-text="t('listing.release_year_tooltip')"
                          kind="unset"
                          :align="tooltipAlign"
                          :class="$style.tooltipIcon"
                          icon-class="w-6 h-6 text-gray-500"
                          :tooltip-styles="{ width: '20rem', whiteSpace: 'normal' }"
                        />
                      </template>
                    </Select>
                  </div>
                  <div :class="$style.infoSubBox">
                    <Select
                      v-model="listingData.month"
                      :options="monthOptions"
                      :label="t('listing.month')"
                      required
                      :placeholder="t('listing.from_plate')"
                      :disabled="!isModelSelected || isFormDisabled"
                      :invalid-message="errors.get('month')"
                      @input="alert = null"
                      @update:model-value="errors.clear('month')"
                    >
                      <template #label-extra>
                        <TooltipIcon
                          :icon="ExclamationCircleIcon"
                          :tooltip-text="t('listing.release_year_tooltip')"
                          kind="unset"
                          :align="tooltipAlign"
                          :class="$style.tooltipIcon"
                          icon-class="w-6 h-6 text-gray-500"
                          :tooltip-styles="{ width: '20rem', whiteSpace: 'normal' }"
                        />
                      </template>
                    </Select>
                  </div>
                </div>
                <div :class="$style.releaseYearCheckbox">
                  <CheckBox
                    v-model="releaseYearMatchesComplectation"
                    :option-label="t('listing.release_year_matches_complectation')"
                    :disabled="isFormDisabled"
                  />
                </div>
              </div>
            </div>
          </section>

          <section :class="$style.panel">
            <div :class="$style.panelHeader">
              <span :class="$style.panelStep">{{ isCreate ? 4 : 3 }}</span>
              <div :class="$style.panelHeaderText">
                <h2 :class="$style.panelTitle">
                  {{ t("listing.panel_price_location") }}
                </h2>
              </div>
            </div>
            <div :class="$style.panelBody">
              <div :class="$style.fieldsGrid">
                <div :class="$style.infoRow">
                  <div :class="$style.infoBox">
                    <InputNumber
                      v-model="listingData.price"
                      :label="`${t('listing.price')} *`"
                      :disabled="isFormDisabled"
                      :invalid-message="errors.get('price')"
                      thousands-separated
                      required
                      @input="alert = null"
                      @update:model-value="errors.clear('price')"
                    />
                  </div>
                  <SearchableSelect
                    v-model="listingData.city"
                    :options="chinaCityOptions"
                    :class="$style.infoBox"
                    :label="t('listing.china_city')"
                    :disabled="isFormDisabled"
                    :invalid-message="errors.get('chinaCity')"
                    @input="alert = null"
                    @update:model-value="errors.clear('chinaCity')"
                  >
                    <template #helper-text>
                      <div>{{ t("listing.city_helper") }}</div>
                    </template>
                  </SearchableSelect>
                </div>
                <label :class="[$style.internalNumberLabel, $style.fieldsFull]">
                  {{ listingData.manualInternalNumber ? `${t("listing.internal_number_label")} *` : t("listing.internal_number_label") }}
                </label>
                <div :class="[$style.fieldsFull, 'mb-3']">
                  <CheckBox
                    v-model="listingData.manualInternalNumber"
                    :option-label="t('listing.internal_number_manual')"
                    :disabled="isFormDisabled"
                    @update:model-value="errors.clear('internalNumber')"
                  />
                </div>
                <div
                  v-if="listingData.manualInternalNumber"
                  :class="$style.fieldsFull"
                >
                  <Input
                    v-model="listingData.internalNumber"
                    :disabled="isFormDisabled"
                    :invalid-message="errors.get('internalNumber')"
                    required
                    @input="alert = null"
                    @update:model-value="errors.clear('internalNumber')"
                  />
                </div>
                <div
                  v-else
                  :class="[$style.fieldsFull, 'mb-3']"
                >
                  <div :class="$style.autoNumberField">
                    <SparklesIcon :class="$style.autoNumberIcon" />
                    <span :class="$style.autoNumberValue">
                      {{ autoInternalNumberPreview }}-<span :class="$style.autoNumberSeq">N</span>
                    </span>
                    <span :class="$style.autoNumberBadge">
                      {{ t("listing.internal_number_auto_badge") }}
                    </span>
                  </div>
                  <p :class="$style.internalNumberHint">
                    {{ t("listing.internal_number_auto_hint") }}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section :class="$style.panel">
            <div :class="$style.panelHeader">
              <span :class="$style.panelStep">{{ isCreate ? 5 : 4 }}</span>
              <div :class="$style.panelHeaderText">
                <h2 :class="$style.panelTitle">
                  {{ t("listing.panel_seller") }}
                </h2>
              </div>
            </div>
            <div :class="$style.panelBody">
              <div :class="$style.fieldsGrid">
                <Input
                  v-model="listingData.sellerContactName"
                  :label="t('listing.seller_contact_name_label')"
                  :class="$style.infoSubBox"
                  :disabled="isFormDisabled"
                  :invalid-message="errors.get('sellerContactName')"
                  @input="alert = null"
                  @update:model-value="errors.clear('sellerContactName')"
                />
                <Input
                  v-model="listingData.sellerPhone"
                  :label="t('listing.seller_phone_label')"
                  :class="$style.infoSubBox"
                  :disabled="isFormDisabled"
                  :invalid-message="errors.get('sellerPhone')"
                  @input="alert = null"
                  @update:model-value="errors.clear('sellerPhone')"
                />
                <Input
                  v-model="listingData.externalUrl"
                  :label="t('listing.external_url_label')"
                  :placeholder="t('listing.diagnostic_placeholder')"
                  :class="$style.infoBox"
                  :disabled="isFormDisabled"
                  :invalid-message="errors.get('externalUrl')"
                  @input="alert = null"
                  @update:model-value="errors.clear('externalUrl')"
                />
                <div :class="$style.infoBox">
                  <Textarea
                    v-model="listingData.comment"
                    :label="t('listing.comment_label')"
                    :rows="3"
                    :disabled="isFormDisabled"
                    :invalid-message="errors.get('comment')"
                    @input="alert = null"
                    @update:model-value="errors.clear('comment')"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
        <div :class="$style.rightColumn">
          <div :class="$style.sectionBlock">
            <div :class="$style.sectionHeader">
              <span :class="$style.sectionTitle">
                {{ t("listing.condition") }}<span v-if="!listingData.original_paint"> *</span>
              </span>
            </div>
            <div class="mb-4">
              <CheckBox
                v-model="listingData.original_paint"
                :option-label="t('common.original_paint')"
                :disabled="isFormDisabled"
                @update:model-value="errors.clear('originalPaint')"
              />
            </div>
            <Textarea
              v-model="listingData.condition"
              :rows="4"
              :invalid-message="errors.get('condition')"
              :disabled="isFormDisabled"
              :required="!listingData.original_paint"
              @input="alert = null"
              @update:model-value="errors.clear('condition')"
            />
            <OriginalTextTranslation
              :data="listingSourceTexts"
              :current="listingData.condition"
              field="description"
            />
          </div>
          <div :class="$style.sectionBlock">
            <div :class="$style.sectionHeader">
              <span :class="$style.sectionTitle">
                {{ t("listing.additional_options") }}
              </span>
            </div>
            <Textarea
              v-model="listingData.options"
              :rows="3"
              :invalid-message="errors.get('options')"
              :disabled="isFormDisabled"
              @input="alert = null"
              @update:model-value="errors.clear('options')"
            />
            <OriginalTextTranslation
              :data="listingSourceTexts"
              :current="listingData.options"
              field="options"
            />
          </div>
          <div :class="$style.sectionBlock">
            <div :class="$style.sectionHeader">
              <span :class="$style.sectionTitle">
                {{ t("listing.photo") }}<span> *</span>
              </span>
            </div>
            <div :class="$style.photoGrid">
              <div
                v-for="(file, i) in listingData.photoFiles"
                :key="file.id || i"
                :class="[$style.photoItem, isDropTarget('photo', i) && $style.photoItemDropTarget]"
                draggable="true"
                @dragstart="onDragStart($event, 'photo', i)"
                @dragover.prevent="onDragOver($event, 'photo', i)"
                @dragleave="onDragLeave('photo', i)"
                @drop.prevent="onDrop('photo', i)"
                @dragend="onDragEnd"
              >
                <CarPreviewImage
                  :src="listingImageSrc(file, 'thumb')"
                  :fallback-src="file.url"
                  :alt="t('listing.photo_alt')"
                  :image-class="$style.photoImage"
                  draggable="false"
                  @click="openFullscreenPhoto(file.url)"
                />
                <CommonButton
                  type="button"
                  kind="white"
                  size="xs"
                  :class="$style.photoRemoveBtn"
                  :disabled="isFormDisabled"
                  @click.stop="removePhoto(file)"
                >
                  <TrashIcon class="w-3 h-3" />
                </CommonButton>
                <div :class="$style.dragHandle">
                  <ArrowsUpDownIcon class="w-4 h-4" />
                </div>
              </div>
            </div>
            <div :class="$style.inputFileWrapper">
              <InputFile
                :max-files="250"
                :current-files-count="listingData.photoFiles.length"
                :upload-max-filesize="'20MB'"
                :accept="'image/jpeg,image/png'"
                :type="InputsTypeEnum.File"
                :disabled="isFormDisabled || isPhotoUploading"
                :loading="isPhotoUploading"
                :status-message="photoUploadStatus"
                :is-invalid="!!errors.get('photoFiles')"
                :invalid-message="errors.get('photoFiles')"
                :restrictions-text="t('listing.photo_restrictions')"
                :button-text="t('listing.choose_photo')"
                multiple
                @input="uploadPhotos"
                @update:model-value="errors.clear('photoFiles')"
              />
            </div>

            <transition name="fade">
              <div
                v-if="fullscreenPhoto"
                :class="$style.fullscreenPhoto"
                @click.self="closeFullscreenPhoto"
              >
                <button
                  type="button"
                  :class="$style.closeFullscreenBtn"
                  :aria-label="t('listing.close')"
                  @click="closeFullscreenPhoto"
                >
                  <XMarkIcon class="w-7 h-7 text-white" />
                </button>
                <img
                  :src="fullscreenPhoto"
                  :alt="t('listing.photo_alt')"
                  :class="$style.fullscreenImage"
                >
                <div
                  v-if="fullscreenCaption"
                  :class="$style.fullscreenCaption"
                >
                  {{ fullscreenCaption }}
                </div>
              </div>
            </transition>
          </div>
          <div :class="$style.sectionBlock">
            <div :class="$style.sectionHeader">
              <span :class="$style.sectionTitle">
                {{ t("listing.nameplate_photo") }}<span v-if="listingData.vin"> *</span>
              </span>
            </div>

            <div :class="$style.photoGrid">
              <div
                v-for="(file, i) in listingData.nameplateFiles"
                :key="file.id || i"
                :class="[$style.photoItem, isDropTarget('nameplate', i) && $style.photoItemDropTarget]"
                draggable="true"
                @dragstart="onDragStart($event, 'nameplate', i)"
                @dragover.prevent="onDragOver($event, 'nameplate', i)"
                @dragleave="onDragLeave('nameplate', i)"
                @drop.prevent="onDrop('nameplate', i)"
                @dragend="onDragEnd"
              >
                <CarPreviewImage
                  :src="listingImageSrc(file, 'thumb')"
                  :fallback-src="file.url"
                  :alt="t('listing.nameplate_photo_alt')"
                  :image-class="$style.photoImage"
                  draggable="false"
                  @click="openFullscreenPhoto(file.url)"
                />
                <CommonButton
                  type="button"
                  kind="white"
                  size="xs"
                  :class="$style.photoRemoveBtn"
                  :disabled="isFormDisabled"
                  @click.stop="removeNameplate(file)"
                >
                  <TrashIcon class="w-3 h-3" />
                </CommonButton>
                <div :class="$style.dragHandle">
                  <ArrowsUpDownIcon class="w-4 h-4" />
                </div>
              </div>
            </div>
            <div :class="$style.inputFileWrapper">
              <InputFile
                :max-files="200"
                :current-files-count="listingData.nameplateFiles.length"
                :upload-max-filesize="'20MB'"
                :accept="'image/jpeg,image/png'"
                :type="InputsTypeEnum.File"
                :disabled="isFormDisabled || isNameplateUploading"
                :loading="isNameplateUploading"
                :status-message="nameplateUploadStatus"
                :is-invalid="!!errors.get('nameplateFiles')"
                :invalid-message="errors.get('nameplateFiles')"
                :restrictions-text="t('listing.photo_restrictions')"
                :button-text="t('listing.choose_nameplate_photo')"
                multiple
                @input="uploadNameplates"
                @update:model-value="errors.clear('nameplateFiles')"
              />
            </div>
          </div>
          <div :class="$style.sectionBlock">
            <div :class="$style.sectionHeader">
              <span :class="$style.sectionTitle">
                {{ t("listing.defect_photo") }}
              </span>
            </div>
            <div :class="$style.photoGrid">
              <div
                v-for="(file, i) in listingData.defectFiles"
                :key="file.id || i"
                :class="[$style.photoItem, isDropTarget('defect', i) && $style.photoItemDropTarget]"
                draggable="true"
                @dragstart="onDragStart($event, 'defect', i)"
                @dragover.prevent="onDragOver($event, 'defect', i)"
                @dragleave="onDragLeave('defect', i)"
                @drop.prevent="onDrop('defect', i)"
                @dragend="onDragEnd"
              >
                <CarPreviewImage
                  :src="listingImageSrc(file, 'thumb')"
                  :fallback-src="file.url"
                  :alt="t('listing.defect_photo_alt')"
                  :image-class="$style.photoImage"
                  draggable="false"
                  @click="openFullscreenPhoto(file.url, file.descriptions)"
                />
                <CommonButton
                  type="button"
                  kind="white"
                  size="xs"
                  :class="$style.photoRemoveBtn"
                  :disabled="isFormDisabled"
                  @click.stop="removeDefect(file)"
                >
                  <TrashIcon class="w-3 h-3" />
                </CommonButton>
                <div :class="$style.dragHandle">
                  <ArrowsUpDownIcon class="w-4 h-4" />
                </div>
              </div>
            </div>
            <div :class="$style.inputFileWrapper">
              <InputFile
                :max-files="200"
                :current-files-count="listingData.defectFiles.length"
                :upload-max-filesize="'20MB'"
                :accept="'image/jpeg,image/png'"
                :type="InputsTypeEnum.File"
                :disabled="isFormDisabled || isDefectUploading"
                :loading="isDefectUploading"
                :status-message="defectUploadStatus"
                :invalid-message="errors.get('defectFiles')"
                :restrictions-text="t('listing.photo_restrictions')"
                :button-text="t('listing.choose_defect_photo')"
                multiple
                @input="uploadDefects"
                @update:model-value="errors.clear('defectFiles')"
              />
            </div>
          </div>
          <div :class="$style.sectionBlock">
            <div :class="$style.sectionHeader">
              <span :class="$style.sectionTitle">
                {{ t("listing.video") }}
              </span>
            </div>
            <div
              v-if="numericId"
              :class="$style.videoHeader"
            >
              <Label
                v-if="listingData.total_video"
                kind="yellow"
                :text="t('listing.video_requested')"
              />
              <NuxtLink
                :to="{ name: `personal-listings-id-video`, params: { id: numericId } }"
                :class="$style.viewRequestsLink"
              >
                {{ t("listing.view_video_requests") }} ({{ listingData.total_video }})
              </NuxtLink>
            </div>
            <div :class="$style.videoGrid">
              <div
                v-for="(file, i) in listingData.videoFiles"
                :key="file.id || i"
                :class="$style.videoItem"
                @click="openFullscreenVideo(file.url)"
              >
                <video
                  :src="file.url"
                  :poster="file.poster || undefined"
                  :class="$style.videoElement"
                  preload="metadata"
                  playsinline
                  :controls="false"
                />
                <PlayIcon
                  :class="$style.playIcon"
                  style="transform: translate(-50%, -50%)"
                  :size="64"
                />
                <CommonButton
                  type="button"
                  kind="white"
                  size="xs"
                  :class="$style.photoRemoveBtn"
                  :disabled="isFormDisabled"
                  @click.stop="removeVideo(file)"
                >
                  <TrashIcon class="w-3 h-3" />
                </CommonButton>
              </div>
            </div>
            <InputFile
              :max-files="20"
              :current-files-count="listingData.videoFiles.length"
              :upload-max-filesize="'300MB'"
              :accept="'.mp4,.mov,video/mp4,video/quicktime'"
              :type="InputsTypeEnum.File"
              :disabled="isFormDisabled || isVideoUploading"
              :loading="isVideoUploading"
              :status-message="videoUploadStatus"
              :invalid-message="errors.get('videoFiles')"
              :restrictions-text="t('listing.video_restrictions')"
              :button-text="t('listing.choose_video')"
              multiple
              @input="uploadVideos"
              @update:model-value="errors.clear('videoFiles')"
            />
            <transition name="fade">
              <div
                v-if="fullscreenVideo"
                :class="$style.fullscreenVideo"
                @click.self="closeFullscreenVideo"
              >
                <button
                  type="button"
                  :class="$style.closeFullscreenBtn"
                  :aria-label="t('listing.close')"
                  @click="closeFullscreenVideo"
                >
                  <XMarkIcon class="w-7 h-7 text-white" />
                </button>
                <video
                  :src="fullscreenVideo"
                  controls
                  autoplay
                  playsinline
                  :class="$style.fullscreenVideoElement"
                />
              </div>
            </transition>
          </div>
          <div :class="$style.sectionBlock">
            <div :class="$style.sectionHeader">
              <span :class="$style.sectionTitle">
                {{ t("listing.insurance_payouts_and_vehicle_maintenance") }}
              </span>
            </div>
            <div
              v-if="numericId"
              :class="$style.diagnosticHeader"
            >
              <Label
                v-if="listingData.total_compensation"
                kind="yellow"
                :text="t('listing.compensation_requested')"
              />
              <NuxtLink
                :to="{ name: 'personal-listings-id-compensation', params: { id: numericId } }"
                :class="$style.viewRequestsLink"
              >
                {{ t("listing.view_compensation_requests") }} ({{ listingData.total_compensation }})
              </NuxtLink>
            </div>
            <p :class="$style.compensationSubheader">
              {{ t("listing.cases_verification_and_insurance_payouts") }}
            </p>
            <NuxtLink
              v-if="listingData.hasCompensation"
              :to="{
                name: 'personal-listings-id-compensation-report',
                params: { id: numericId },
              }"
              :class="$style.showReportLink"
            >
              {{ t("listing.show_report") }}
              <ArrowUpRightIcon class="w-4 h-4 ml-1" />
            </NuxtLink>
            <Button
              v-else
              type="button"
              kind="lightgrey"
              @click="navigateTo({
                name: 'personal-listings-id-compensation-report',
                params: { id: numericId },
              })"
            >
              <PlusIcon class="w-4 h-4 mr-2" />
              {{ t("listing.create_report") }}
            </Button>
          </div>
          <div :class="$style.sectionBlock">
            <div :class="$style.sectionHeader">
              <span :class="$style.sectionTitle">
                {{ t("listing.diagnostic") }}
              </span>
            </div>
            <div
              v-if="numericId"
              :class="$style.diagnosticHeader"
            >
              <Label
                v-if="listingData.total_diagnostic"
                kind="yellow"
                :text="t('listing.diagnostic_requested')"
              />
              <NuxtLink
                :to="{ name: `personal-listings-id-diagnostic`, params: { id: numericId } }"
                :class="$style.viewRequestsLink"
              >
                {{ t("listing.view_diagnostic_requests") }} ({{ listingData.total_diagnostic }})
              </NuxtLink>
            </div>
            <Select
              v-model="numberOfKeysModel"
              :options="numberOfKeysOptions"
              :label="`${t('listing.number_of_keys')}${listingData.diagnosticLink ? ' *' : ''}`"
              :class="$style.infoSubBox"
              :disabled="isFormDisabled"
              :invalid-message="errors.get('numberOfKeys')"
              @input="alert = null"
              @update:model-value="errors.clear('numberOfKeys')"
            />
            <Select
              v-model="diagnosticFormatModel"
              :options="diagnosticFormatOptions"
              :label="t('listing.diagnostic_format')"
              :class="$style.infoSubBox"
              :disabled="isFormDisabled"
              @update:model-value="alert = null"
            />
            <template v-if="diagnosticFormatModel === 'url'">
              <Input
                v-model="listingData.diagnosticLink"
                :label="t('listing.diagnostic_link')"
                :placeholder="t('listing.diagnostic_placeholder')"
                :class="$style.infoSubBox"
                :disabled="isFormDisabled"
                :invalid-message="errors.get('diagnosticUrl')"
                @input="alert = null"
                @update:model-value="errors.clear('diagnosticUrl')"
              />
              <Textarea
                v-model="listingData.diagnosticComment"
                :label="t('listing.diagnostic_comment')"
                :rows="4"
                :autoresized="true"
                :class="$style.infoBox"
                :disabled="isFormDisabled"
                :invalid-message="errors.get('diagnosticComment')"
                @input="alert = null"
                @update:model-value="errors.clear('diagnosticComment')"
              />
              <button
                v-if="isDiagnosticUrl"
                type="button"
                :disabled="isFormDisabled || isDiagnosticImporting"
                :class="$style.diagnosticImportBtn"
                @click="startDiagnosticImport((listingData as any).diagnosticLink)"
              >
                <span v-if="isDiagnosticImporting">{{ t("listing.diagnostic_importing") }}</span>
                <span v-else>{{ t("listing.diagnostic_import_btn") }}</span>
              </button>
              <div
                v-if="isDiagnosticImporting"
                :class="$style.progressBar"
              >
                <div
                  :class="$style.progressFill"
                  :style="{ width: `${diagnosticProgress}%` }"
                />
                <span :class="$style.progressText">{{ diagnosticMessage }}</span>
              </div>
              <Date
                v-model="listingData.diagnostic_created_at"
                :label="`${t('listing.diagnostic_completed_at')}`"
                :disabled-future-dates="true"
                :class="$style.infoSubBox"
                :disabled="isFormDisabled"
                :invalid-message="errors.get('diagnosticCreatedAt')"
                @input="alert = null"
                @update:model-value="errors.clear('diagnosticCreatedAt')"
              />
              <Date
                v-model="listingData.diagnostic_changed_at"
                :label="t('listing.diagnostic_changed_at')"
                :class="$style.infoSubBox"
                disabled
                :invalid-message="errors.get('diagnosticChangedAt')"
              />
            </template>
            <template v-else>
              <NuxtLink
                v-if="numericId"
                :to="{ name: `personal-listings-id-diagnostic-report`, params: { id: numericId } }"
                :class="$style.viewRequestsLink"
              >
                {{ t("listing.diagnostic_go_to_report") }}
              </NuxtLink>
              <p v-else>
                {{ t("listing.diagnostic_report_after_save") }}
              </p>
            </template>
            <!-- Вне условия по формату: собственный отчёт имеет приоритет над ссылкой,
                 поэтому сотрудник должен видеть публичную ссылку при любом формате.
                 Но не когда отчёт скрыт с сайта — ссылка на скрытый отчёт нерабочая. -->
            <div
              v-if="diagnosticReportUrl && diagnosticReportVisible"
              :class="$style.reportLinkBlock"
            >
              <span :class="$style.reportLinkLabel">
                {{ t("listing.report_link_label") }}
              </span>
              <div :class="$style.reportLinkRow">
                <a
                  :href="diagnosticReportUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="$style.reportLinkValue"
                >{{ diagnosticReportUrl }}</a>
                <CommonButton
                  type="button"
                  kind="lightgrey"
                  size="sm"
                  @click="handleCopyReportLink"
                >
                  {{ isReportLinkCopied ? t("listing.report_link_copied") : t("listing.report_link_copy") }}
                </CommonButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div :class="$style.stickyBar">
        <p :class="$style.stickyHint">
          {{ t("listing.save_required_hint") }}
        </p>
        <CommonButton
          type="submit"
          kind="black"
          :class="$style.stickySaveBtn"
          :disabled="isFormDisabled || isMediaUploading"
        >
          {{ isRepublishMode ? t("listing.republish") : t("listing.save") }}
        </CommonButton>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router"
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue"
import dayjs from "dayjs"
import { Switch } from "@headlessui/vue"
import { ExclamationCircleIcon, TrashIcon, XMarkIcon, ArrowUpRightIcon, PlusIcon, ArrowsUpDownIcon, SparklesIcon } from "@heroicons/vue/24/outline"
import SearchableSelect from "@/components/form/SearchableSelect.vue"
import CheckBox from "@/components/form/CheckBox.vue"
import TooltipIcon from "@/components/common/LabelTooltip.vue"
import Header from "@/components/listing/Header.vue"
import Date from "@/components/form/Date.vue"
import Select from "@/components/form/Select.vue"
import Input from "@/components/form/Input.vue"
import InputNumber from "@/components/form/InputNumber.vue"
import Textarea from "@/components/form/Textarea.vue"
import OriginalTextTranslation from "@/components/listing/OriginalTextTranslation.vue"
import type { OptionBase } from "@/types/form/optionType"
import useListing from "@/composables/useListing"
import { useListingRequestSelection } from "@/composables/useListingRequestSelection"
import { useSortedBrands } from "@/composables/useSortedBrands"
import type { Alert } from "@/types/common/alert"
import type { ListingStore, ListingUpdate } from "@/types/requests/listing"
import type { DiagnosticFormat } from "@/types/responses/diagnosticReport"
import Label from "@/components/common/Label.vue"
import PlayIcon from "@/components/icon/Play.vue"
import InputFile from "@/components/form/InputFile.vue"
import { InputsTypeEnum } from "@/types/form/inputsTypeEnum"
import { AlertTypeEnum } from "@/types/common/alert"
import useCities from "@/composables/useCities"
import useCarColors from "@/composables/useCarColors"
import {
  RoleAdmin,
  RoleLogistic,
  RoleSellerClient,
  RoleSellerContent,
  RoleSellerSearch,
} from "@/constants/roles"
import { NuxtLink } from "#components"
import { useUserStore } from "@/stores/user"
import { useListingRequestStore } from "@/stores/listingRequest"
import { useListingImport } from "@/composables/useListingImport"
import { useDiagnosticImport } from "@/composables/useDiagnosticImport"
import { usePhotoDragDrop } from "@/composables/usePhotoDragDrop"
import type { ImportedListingData, Listing } from "@/types/responses/listing"
import type { FileResponse } from "@/types/form/file"
import Button from "~/components/common/Button.vue"
import { SaleStatusWithdrawn } from "@/constants/catalog"
import CarPreviewImage from "@/components/common/CarPreviewImage.vue"
import { listingImageSrc } from "@/utils/catalogImages"

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const userStore = useUserStore()
const { isLogist } = storeToRefs(userStore)
const listingRequestStore = useListingRequestStore()

const rawId = computed(() => String(route.params.id ?? ""))
const numericId = computed(() => Number(rawId.value))
const isCreate = computed(() => rawId.value === "0" || !Number.isFinite(numericId.value) || numericId.value <= 0)
const listingId = ref<number | undefined>(isCreate.value ? undefined : numericId.value)
const suppressWatch = ref(true)
const listingSaleStatus = ref<string | null>(null)
const isRepublishMode = computed(() => listingSaleStatus.value === SaleStatusWithdrawn)

const autoInternalNumberPreview = computed(() => dayjs().format("YYYY-MM-DD"))
const hasNewRequests = computed(() =>
  requestOptions.value.some(opt => opt.status === "new"),
)

const TOOLTIP_ALIGN_END_BREAKPOINT = 1280
const windowWidth = ref(import.meta.client ? window.innerWidth : TOOLTIP_ALIGN_END_BREAKPOINT)

const syncWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

const tooltipAlign = computed((): "center" | "end" =>
  windowWidth.value < TOOLTIP_ALIGN_END_BREAKPOINT ? "end" : "center",
)

type CarDetail = {
  short_power_type?: string | null
  displacement?: string | null
  horse_power?: string | null
  geartype?: string | null
  driven_type?: string | null
  short_scale_type?: string | null
  year?: string | number
  month?: string | number
}
type VariantOption = OptionBase & { details?: CarDetail }
const allVariants = ref<VariantOption[]>([])
const variantsLoaded = ref(false)
const isAllVariantsLoaded = ref(false)
const isVariantsLoading = ref(false)
const areYearsLoaded = ref(false)
const isYearsLoading = ref(false)

const {
  isLoading: isListingLoading,
  isPhotoUploading,
  isVideoUploading,
  photoUploadStatus,
  videoUploadStatus,
  nameplateUploadStatus,
  defectUploadStatus,
  errors,
  listingData,
  store,
  update,
  republish,
  show,
  brands,
  series,
  pendingDeletePhotoIds,
  pendingDeleteVideoIds,
  isModelSelected,
  getBrands,
  getSeries,
  getCarDetails,
  getYearsBySeries,
  getModelsBySeriesAndYear,
  requestOptions,
  loadOpenRequests,
  requestOptionsLoaded,
  uploadPhotos,
  uploadVideos,
  removePhoto,
  removeVideo,
  isNameplateUploading,
  pendingDeleteNameplateIds,
  uploadNameplates,
  removeNameplate,
  isDefectUploading,
  pendingDeleteDefectIds,
  uploadDefects,
  removeDefect,
  managers,
  autoAssignEnabled,
  loadBaseInfo,
  fetchMediaPreviews,
} = useListing()

const requestSelection = computed({
  get: () => listingData.value.selectedInfoRequest,
  set: (value: OptionBase[]) => { listingData.value.selectedInfoRequest = value },
})
const { selectedRequests, initialize: initializeRequestSelection, isLocked: isRequestBindingLocked } = useListingRequestSelection(requestOptions, requestSelection)

const {
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
  isDropTarget,
} = usePhotoDragDrop(
  computed(() => listingData.value.photoFiles),
  computed(() => listingData.value.nameplateFiles),
  computed(() => listingData.value.defectFiles),
)

const { isDiagnosticImporting, diagnosticProgress, diagnosticMessage, startDiagnosticImport } = (() => {
  const {
    isDiagnosticImporting: _isDiagnosticImporting,
    diagnosticProgress: _diagnosticProgress,
    diagnosticMessage: _diagnosticMessage,
    startImport,
  } = useDiagnosticImport({
    onSuccess: (files: FileResponse[]) => {
      files.forEach((file) => {
        listingData.value.defectFiles.push(file)
        listingData.value.defect_ids?.push(file.id)
      })
    },
  })
  return {
    isDiagnosticImporting: _isDiagnosticImporting,
    diagnosticProgress: _diagnosticProgress,
    diagnosticMessage: _diagnosticMessage,
    startDiagnosticImport: startImport,
  }
})()

const isDiagnosticUrl = computed(() => {
  const url = (listingData.value as any).diagnosticLink as string | undefined
  return !!url && /(cheyipai\.com|chaboshi\.cn)/i.test(url)
})

const isMediaUploading = computed(() =>
  isPhotoUploading.value
  || isVideoUploading.value
  || isNameplateUploading.value
  || isDefectUploading.value
  || isDiagnosticImporting.value,
)
const hasLoadedListing = ref(false)
const isFormDisabled = computed(() => isListingLoading.value || isLogist.value || !requestOptionsLoaded.value
  || (!isCreate.value && !hasLoadedListing.value))

const { successNotify, errorNotify } = useNotificationsStore()
const { checkVin } = useApiListing()
const isCheckingVin = ref(false)
const vinCheckStatus = ref<"available" | "exists" | null>(null)

const VIN_LENGTH = 17

const isValidVin = (vin: string) => vin.length === VIN_LENGTH

const onVinUpdate = () => {
  vinCheckStatus.value = null
  errors.value.clear("vin")
}

const handleVinBlur = () => {
  if (!isCreate.value || isFormDisabled.value) {
    return
  }
  if (vinCheckStatus.value) {
    return
  }
  handleCheckVin()
}

const handleCheckVin = async () => {
  const vin = String(listingData.value.vin || "").trim()
  if (!vin || isCheckingVin.value) {
    return
  }

  if (!isValidVin(vin)) {
    errors.value.record({ vin: t("listing.vin_invalid_length") })
    return
  }

  isCheckingVin.value = true
  vinCheckStatus.value = null
  try {
    const response = await checkVin(vin)
    const exists = Boolean(response?.data?.exists)
    if (exists) {
      vinCheckStatus.value = "exists"
      errorNotify("listing.vin_exists")
    }
    else {
      vinCheckStatus.value = "available"
      successNotify("listing.vin_available")
    }
  }
  catch {
    vinCheckStatus.value = null
  }
  finally {
    isCheckingVin.value = false
  }
}

const fromRequestId = computed(() => route.query.from_request ? Number(route.query.from_request) : null)
const prefillBrandId = computed(() => route.query.brand_id ? Number(route.query.brand_id) : null)
const prefillSeriesId = computed(() => route.query.series_id ? Number(route.query.series_id) : null)
const carLinkId = computed(() => route.query.car_link_id ? Number(route.query.car_link_id) : null)

const { cities: citiesList, reload: reloadCities } = useCities()
const { colors: bodyColorOptions } = useCarColors()

const chinaCityOptions = computed(() => {
  return citiesList.value.map((city) => {
    let displayName = ""

    if (locale.value === "zh") {
      displayName = city.name_zh || city.name_ru || city.code
    }
    else {
      displayName = `${city.name_ru || ""} ${city.name_zh ? `(${city.name_zh})` : ""}`.trim()
    }

    return {
      id: city.id,
      value: city.code,
      name: displayName,
      disabled: city.hidden,
    }
  })
})

const numberOfKeysOptions = computed<OptionBase[]>(() => [
  { id: 0, value: "", name: t("common.not_specified"), disabled: false },
  { id: 1, value: 1, name: "1", disabled: false },
  { id: 2, value: 2, name: "2", disabled: false },
  { id: 3, value: 3, name: "3", disabled: false },
])

const numberOfKeysModel = computed({
  get: () => listingData.value.numberOfKeys !== undefined ? listingData.value.numberOfKeys : "",
  set: (val: string | number) => {
    listingData.value.numberOfKeys = val !== "" ? Number(val) : undefined
  },
})

const diagnosticFormatOptions = computed<OptionBase[]>(() => [
  { id: 1, value: "url", name: t("listing.diagnostic_format_url"), disabled: false },
  { id: 2, value: "own", name: t("listing.diagnostic_format_own"), disabled: false },
])

const diagnosticFormatModel = computed({
  get: () => listingData.value.diagnostic_format ?? "own",
  set: (val: DiagnosticFormat) => {
    listingData.value.diagnostic_format = val || "own"
  },
})

const { buildDiagnosticReportUrl } = useDiagnosticReportUrl()

const diagnosticReportUrl = computed(() =>
  buildDiagnosticReportUrl((listingData.value as any).diagnostic_report_code),
)
const diagnosticReportVisible = computed(() =>
  !!(listingData.value as any).diagnostic_report_visible,
)

const { copy } = useCopyToClipboard()
const isReportLinkCopied = ref(false)

async function handleCopyReportLink() {
  if (!diagnosticReportUrl.value) {
    return
  }
  if (await copy(diagnosticReportUrl.value)) {
    isReportLinkCopied.value = true
    window.setTimeout(() => {
      isReportLinkCopied.value = false
    }, 2000)
  }
}

const accessOptions = computed<OptionBase[]>(() => [
  { id: 1, value: "all", name: t("listing.access.all"), disabled: false },
  { id: 2, value: "link", name: t("listing.access.link"), disabled: false },
])

const alert = ref<Alert | null>(null)
const yearOptions = ref<OptionBase[]>([])

const monthOptions = computed<OptionBase[]>(() => [
  { id: 1, value: 1, name: t("common.month_names.january"), disabled: false },
  { id: 2, value: 2, name: t("common.month_names.february"), disabled: false },
  { id: 3, value: 3, name: t("common.month_names.march"), disabled: false },
  { id: 4, value: 4, name: t("common.month_names.april"), disabled: false },
  { id: 5, value: 5, name: t("common.month_names.may"), disabled: false },
  { id: 6, value: 6, name: t("common.month_names.june"), disabled: false },
  { id: 7, value: 7, name: t("common.month_names.july"), disabled: false },
  { id: 8, value: 8, name: t("common.month_names.august"), disabled: false },
  { id: 9, value: 9, name: t("common.month_names.september"), disabled: false },
  { id: 10, value: 10, name: t("common.month_names.october"), disabled: false },
  { id: 11, value: 11, name: t("common.month_names.november"), disabled: false },
  { id: 12, value: 12, name: t("common.month_names.december"), disabled: false },
])

const releaseYearMatchesComplectation = ref(false)

const releaseYearOptions = computed<OptionBase[]>(() => {
  const currentYear = new globalThis.Date().getFullYear()
  const options: OptionBase[] = []
  for (let y = currentYear; y >= currentYear - 25; y--) {
    options.push({ id: y, value: String(y), name: String(y), disabled: false })
  }
  return options
})

const releaseYearStr = ref(
  listingData.value.releaseYear != null ? String(listingData.value.releaseYear) : "",
)

watch(() => listingData.value.releaseYear, (newVal) => {
  const str = newVal != null ? String(newVal) : ""
  if (releaseYearStr.value !== str) {
    releaseYearStr.value = str
  }
}, { immediate: true })

watch(releaseYearStr, (newVal) => {
  const num = newVal ? Number(newVal) : undefined
  if (listingData.value.releaseYear !== num) {
    listingData.value.releaseYear = num
  }
})

const managerOptions = computed(() => {
  const options = managers.value.map(m => ({
    id: m.id,
    name: m.name,
    value: m.id,
    disabled: false,
  }))
  if (!autoAssignEnabled.value) {
    return options
  }
  return [
    { id: 0, name: t("listing.manager_auto"), value: 0, disabled: false },
    ...options,
  ]
})

const isLoadingBrands = ref(false)
const isFormInitializing = ref(true)
const isLoadingSeries = ref(false)
let brandAbort: AbortController | null = null

const { sortedBrands } = useSortedBrands(brands)

const matchesFilters = (car: VariantOption, excludeKey?: string) => {
  const d = car.details || {}
  const isMatchOrEmpty = (carValue: string | number | null | undefined, filterValue: string | number | undefined) => {
    if (filterValue === undefined || filterValue === "" || filterValue === null) {
      return true
    }

    if (carValue === undefined || carValue === null || carValue === "" || carValue === "-" || carValue === "0") {
      return true
    }

    if (typeof filterValue === "number") {
      return Number(carValue) === filterValue
    }

    return String(carValue) === String(filterValue)
  }
  if (excludeKey !== "engineType" && !isMatchOrEmpty(d.short_power_type, listingData.value.engineType)) {
    return false
  }
  if (excludeKey !== "engine" && !isMatchOrEmpty(d.displacement, listingData.value.engine)) {
    return false
  }
  if (excludeKey !== "power" && !isMatchOrEmpty(d.horse_power, listingData.value.power)) {
    return false
  }
  if (excludeKey !== "transmission" && !isMatchOrEmpty(d.geartype, listingData.value.transmission)) {
    return false
  }
  if (excludeKey !== "drive" && !isMatchOrEmpty(d.driven_type, listingData.value.drive)) {
    return false
  }
  if (excludeKey !== "bodyType" && !isMatchOrEmpty(d.short_scale_type, listingData.value.bodyType)) {
    return false
  }

  return true
}

const filteredVariants = computed(() => {
  if (!variantsLoaded.value) {
    return []
  }
  return allVariants.value.filter(v => matchesFilters(v))
})

const filteredModelOptions = computed(() => {
  return filteredVariants.value.map(v => ({ ...v, disabled: false }))
})

const availableEngineTypes = computed<OptionBase[]>(() => {
  if (!variantsLoaded.value) {
    return []
  }

  if (listingData.value.model) {
    const selectedVariant = allVariants.value.find(v => v.value === listingData.value.model?.value)

    const val = selectedVariant?.details?.short_power_type
    if (!val || val === "-" || val === "all") {
      return []
    }

    const staticOpts = [
      { id: 1, value: "hybrid", name: t("cars.power_type.hybrid"), disabled: false },
      { id: 2, value: "petrol", name: t("cars.power_type.petrol"), disabled: false },
      { id: 3, value: "diesel", name: t("cars.power_type.diesel"), disabled: false },
      { id: 4, value: "electric", name: t("cars.power_type.electric"), disabled: false },
      { id: 5, value: "gas", name: t("cars.power_type.gas"), disabled: false },
    ]
    return staticOpts.filter(opt => opt.value === val)
  }

  const candidates = allVariants.value.filter(v => matchesFilters(v, "engineType"))
  const values = new Set(candidates.map(c => c.details?.short_power_type).filter(Boolean))

  const staticOpts = [
    { id: 1, value: "hybrid", name: t("cars.power_type.hybrid"), disabled: false },
    { id: 2, value: "petrol", name: t("cars.power_type.petrol"), disabled: false },
    { id: 3, value: "diesel", name: t("cars.power_type.diesel"), disabled: false },
    { id: 4, value: "electric", name: t("cars.power_type.electric"), disabled: false },
    { id: 5, value: "gas", name: t("cars.power_type.gas"), disabled: false },
  ]
  return staticOpts.filter(opt => values.has(opt.value as string))
})

const availableEngines = computed<OptionBase[]>(() => {
  if (!variantsLoaded.value) {
    return []
  }

  if (listingData.value.model) {
    const selectedVariant = allVariants.value.find(v => v.value === listingData.value.model?.value)
    const val = selectedVariant?.details?.displacement

    if (val && val !== "-" && val !== "0" && val !== "all") {
      return [{ id: 0, value: val, name: val, disabled: false }]
    }

    return []
  }

  const candidates = allVariants.value.filter(v => matchesFilters(v, "engine"))
  const values = new Set(
    candidates.map(c => c.details?.displacement)
      .filter((v): v is string => !!v && v !== "-" && v !== "0" && v !== "all"),
  )
  return Array.from(values).sort().map((val, idx) => ({
    id: idx,
    value: val,
    name: val,
    disabled: false,
  }))
})

const powerSelectModel = computed({
  get: () => listingData.value.power !== undefined ? String(listingData.value.power) : "",
  set: (val: string) => {
    listingData.value.power = val ? Number(val) : undefined
  },
})

const availablePowers = computed<OptionBase[]>(() => {
  if (!variantsLoaded.value) {
    return []
  }

  if (listingData.value.model) {
    const selectedVariant = allVariants.value.find(v => v.value === listingData.value.model?.value)
    const val = selectedVariant?.details?.horse_power

    if (val && val !== "-" && val !== "0" && val !== "all") {
      return [{ id: 0, value: String(val), name: String(val), disabled: false }]
    }
    return []
  }

  const candidates = allVariants.value.filter(v => matchesFilters(v, "power"))
  const values = new Set(candidates.map(c => parseInt(c.details?.horse_power || "0")).filter(v => v > 0))

  return Array.from(values).sort((a, b) => a - b).map((val, idx) => ({
    id: idx,
    value: String(val),
    name: String(val),
    disabled: false,
  }))
})

const availableTransmissions = computed<OptionBase[]>(() => {
  if (!variantsLoaded.value) {
    return []
  }

  const staticOpts = [
    { id: 1, value: "mt", name: t("cars.gearbox.mt"), disabled: false },
    { id: 2, value: "at", name: t("cars.gearbox.at"), disabled: false },
    { id: 3, value: "dct", name: t("cars.gearbox.dct"), disabled: false },
    { id: 4, value: "cvt", name: t("cars.gearbox.cvt"), disabled: false },
    { id: 5, value: "am", name: t("cars.gearbox.am"), disabled: false },
    { id: 6, value: "ecvt", name: t("cars.gearbox.ecvt"), disabled: false },
    { id: 7, value: "single", name: t("cars.gearbox.single"), disabled: false },
    { id: 8, value: "dht", name: t("cars.gearbox.dht"), disabled: false },
    { id: 9, value: "other", name: t("cars.gearbox.other"), disabled: false },
  ]

  if (listingData.value.model) {
    const selectedVariant = allVariants.value.find(v => v.value === listingData.value.model?.value)
    const val = selectedVariant?.details?.geartype

    if (val && val !== "-" && val !== "0" && val !== "all") {
      return staticOpts.filter(opt => opt.value === val)
    }
    else {
      return []
    }
    return staticOpts
  }

  const candidates = allVariants.value.filter(v => matchesFilters(v, "transmission"))
  const values = new Set(candidates.map(c => c.details?.geartype).filter(Boolean))
  return staticOpts.filter(opt => values.has(opt.value as string))
})

const availableDrives = computed<OptionBase[]>(() => {
  if (!variantsLoaded.value) {
    return []
  }

  const staticOpts = [
    { id: 1, value: "awd", name: t("cars.drive_type.awd"), disabled: false },
    { id: 2, value: "fwd", name: t("cars.drive_type.fwd"), disabled: false },
    { id: 3, value: "rwd", name: t("cars.drive_type.rwd"), disabled: false },
  ]

  if (listingData.value.model) {
    const selectedVariant = allVariants.value.find(v => v.value === listingData.value.model?.value)
    const val = selectedVariant?.details?.driven_type

    if (val && val !== "-" && val !== "0" && val !== "all") {
      return staticOpts.filter(opt => opt.value === val)
    }
    else {
      return []
    }
    return staticOpts
  }

  const candidates = allVariants.value.filter(v => matchesFilters(v, "drive"))
  const values = new Set(candidates.map(c => c.details?.driven_type).filter(Boolean))
  return staticOpts.filter(opt => values.has(opt.value as string))
})

const availableBodyTypes = computed<OptionBase[]>(() => {
  if (!variantsLoaded.value) {
    return []
  }

  const staticOpts = [
    { id: 1, value: "sedan", name: t("cars.scale_type.sedan"), disabled: false },
    { id: 2, value: "suv", name: t("cars.scale_type.suv"), disabled: false },
    { id: 3, value: "coupe", name: t("cars.scale_type.coupe"), disabled: false },
    { id: 4, value: "hatchback", name: t("cars.scale_type.hatchback"), disabled: false },
    { id: 5, value: "minivan", name: t("cars.scale_type.minivan"), disabled: false },
    { id: 6, value: "pickup", name: t("cars.scale_type.pickup"), disabled: false },
  ]

  if (listingData.value.model) {
    const selectedVariant = allVariants.value.find(v => v.value === listingData.value.model?.value)
    const val = selectedVariant?.details?.short_scale_type

    if (val && val !== "-" && val !== "0" && val !== "all") {
      return staticOpts.filter(opt => opt.value === val)
    }
    else {
      return []
    }
    return staticOpts
  }

  const candidates = allVariants.value.filter(v => matchesFilters(v, "bodyType"))
  const values = new Set(candidates.map(c => c.details?.short_scale_type).filter(Boolean))
  return staticOpts.filter(opt => values.has(opt.value as string))
})

onMounted(async () => {
  suppressWatch.value = true
  isLoadingBrands.value = true
  try {
    await reloadCities()

    const [brandsData] = await Promise.all([
      getBrands(),
      loadOpenRequests(),
    ])
    brands.value = brandsData

    if (!requestOptionsLoaded.value) {
      errorNotify(t("needs.action_error"))
    }

    if (fromRequestId.value) {
      const matchedRequest = requestOptions.value.find(
        opt => Number(opt.value) === fromRequestId.value,
      )
      if (matchedRequest && !matchedRequest.disabled) {
        listingData.value.selectedInfoRequest = [matchedRequest]
      }
    }

    brands.value = brandsData
  }
  catch (error) {
    console.error("Error loading brands:", error)
  }
  finally {
    isLoadingBrands.value = false
  }

  try {
    if (!isCreate.value) {
      await loadListingData(numericId.value)
      await nextTick()
      return
    }

    await loadBaseInfo()

    const targetBrandId = prefillBrandId.value ?? Number(sortedBrands.value[0]?.value)
    const targetBrand = sortedBrands.value.find(b => Number(b.value) === targetBrandId)
      ?? sortedBrands.value[0]

    if (targetBrand) {
      listingData.value.brand = { ...targetBrand }
      await nextTick()
      await loadSeriesForBrand(Number(targetBrand.value), true)
    }

    const targetSeries = prefillSeriesId.value
      ? series.value.find(s => Number(s.value) === prefillSeriesId.value) ?? series.value[0]
      : series.value[0]

    if (targetSeries) {
      listingData.value.series = { ...targetSeries }
      const years = await getYearsBySeries(Number(targetSeries.value))
      yearOptions.value = years.sort((a, b) => Number(b.value) - Number(a.value))
      const newestYear: OptionBase | undefined = yearOptions.value[0]
      if (newestYear) {
        listingData.value.year = { ...newestYear }
        await selectSeriesAndPopulate(Number(targetSeries.value))
      }
    }

    await nextTick()
  }
  catch (error) {
    console.error("Error loading listing form data:", error)
  }
  finally {
    suppressWatch.value = false
    isFormInitializing.value = false
  }
})

const refreshManagersOnVisible = () => {
  if (document.visibilityState === "visible" && isCreate.value) {
    loadBaseInfo()
  }
}

onMounted(() => {
  syncWindowWidth()
  window.addEventListener("resize", syncWindowWidth)
  document.addEventListener("visibilitychange", refreshManagersOnVisible)
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", syncWindowWidth)
  document.removeEventListener("visibilitychange", refreshManagersOnVisible)
})

const loadListingData = async (id: number) => {
  hasLoadedListing.value = false
  try {
    const listing = await show(id)
    if (!listing) {
      errorNotify(t("listing.load_error"))
      return
    }
    suppressWatch.value = true
    listingSaleStatus.value = listing.sale_status ?? null
    await populateFormData(listing)
    hasLoadedListing.value = true

    if (isRepublishMode.value) {
      listingData.value.shownOnSite = true
    }

    await nextTick()
  }
  catch {
    alert.value = {
      type: AlertTypeEnum.Error,
      subtitle: t("common.error"),
      text: t("listing.load_error"),
    }
  }
  finally {
    suppressWatch.value = false
  }
}

type ListingSourceTexts = Pick<Listing, "description_ru" | "description_zh" | "options_ru" | "options_zh" | "original_locale">

const listingSourceTexts = ref<Partial<ListingSourceTexts>>({})

const applyRequestTotals = (listing?: Partial<Listing> | null) => {
  if (!listing) {
    return
  }

  const totals = {
    total_video: listing.total_video ?? listingData.value.total_video ?? 0,
    total_diagnostic: listing.total_diagnostic ?? listingData.value.total_diagnostic ?? 0,
    total_compensation: listing.total_compensation ?? listingData.value.total_compensation ?? 0,
    total_booking: listing.total_booking ?? listingRequestStore.listingTotals.total_booking ?? 0,
  }

  listingData.value.total_video = totals.total_video
  listingData.value.total_diagnostic = totals.total_diagnostic
  listingData.value.total_compensation = totals.total_compensation

  listingRequestStore.setListingTotals({
    ...listingRequestStore.listingTotals,
    ...totals,
  })
}

const setListingSourceTexts = (listing?: Partial<ListingSourceTexts> | null) => {
  listingSourceTexts.value = {
    description_ru: listing?.description_ru ?? null,
    description_zh: listing?.description_zh ?? null,
    options_ru: listing?.options_ru ?? null,
    options_zh: listing?.options_zh ?? null,
    original_locale: listing?.original_locale ?? null,
  }
}

const populateFormData = async (listing: any) => {
  setListingSourceTexts(listing)
  const bodyColor = bodyColorOptions.value.find(c => c.value === listing.body_color)
  const city = chinaCityOptions.value.find(c => c.value === listing.city)
  const getVal = (val: string | null | undefined) =>
    (val && val !== "-" && val !== "0" && val !== "all") ? val : ""

  initializeRequestSelection(listing.search_requests ?? [])

  Object.assign(listingData.value, {
    accessOption: listing.visibility || "all",
    selectedOption: listing.condition || "used",
    shownOnSite: !!listing.shown_on_site,
    diagnostic_created_at: listing.diagnostic_created_at || "",
    diagnostic_changed_at: listing.diagnostic_changed_at || "",
    diagnostic_format: listing.diagnostic_format || "url",
    diagnostic_report_code: listing.diagnostic_report_code || "",
    diagnostic_report_visible: !!listing.diagnostic_report_visible,
    vin: listing.vin || "",
    month: listing.month ? String(listing.month) : "",
    mileage: listing.mileage || undefined,
    bodyColor: bodyColor ? { ...bodyColor } : undefined,
    price: listing.price || undefined,
    city: city ? { ...city } : undefined,
    internalNumber: listing.internal_number || "",
    manualInternalNumber: !!listing.internal_number,
    externalUrl: listing.external_url || "",
    sellerContactName: listing.seller_contact_name || "",
    sellerPhone: listing.seller_phone || "",
    comment: listing.comment || "",
    condition: listing.ol_description || "",
    options: listing.ol_options || "",
    original_paint: !!listing.original_paint,
    diagnosticLink: listing.diagnostic_url || "",
    diagnosticComment: listing.diagnostic_comment || "",
    numberOfKeys: listing.number_of_keys ?? undefined,
    releaseYear: listing.release_year ?? undefined,
    photoFiles: listing.photos || [],
    videoFiles: listing.videos || [],
    nameplateFiles: listing.nameplates || [],
    defectFiles: listing.defects || [],
    total_video: listing.total_video || 0,
    total_diagnostic: listing.total_diagnostic || 0,
    total_compensation: listing.total_compensation || 0,
    engineType: getVal(listing.car?.short_power_type),
    engine: getVal(listing.car?.displacement),
    power: listing.car?.horse_power ? Number(listing.car.horse_power) : undefined,
    transmission: getVal(listing.car?.common_short_gearbox || listing.car?.gearbox),
    drive: getVal(listing.car?.drive_type),
    bodyType: getVal(listing.car?.scale),
    photo_ids: [],
    video_ids: [],
    nameplate_ids: [],
    defect_ids: [],
    userId: listing.user_id,
    hasCompensation: listing.has_compensation,
  })

  if (listing.brand) {
    let foundBrand = brands.value.find(b => b.value === listing.brand.id)

    if (!foundBrand) {
      foundBrand = {
        id: listing.brand.id,
        value: listing.brand.id,
        name: listing.brand.name,
        disabled: false,
      }
      brands.value.push(foundBrand)
      brands.value = [...brands.value]
    }

    listingData.value.brand = { ...foundBrand }

    await nextTick()
    await loadSeriesForBrand(listing.brand.id, true)
  }

  if (listing.series) {
    let seriesOption = series.value.find(s => s.value === listing.series.id)

    if (!seriesOption) {
      seriesOption = {
        id: listing.series.id,
        value: listing.series.id,
        name: listing.series.name,
        disabled: false,
      }
      series.value.push(seriesOption)
    }

    listingData.value.series = { ...seriesOption }

    if (listing.year) {
      const singleYearOption: OptionBase = {
        id: Number(listing.year),
        value: Number(listing.year),
        name: String(listing.year),
        disabled: false,
      }

      yearOptions.value = [singleYearOption]
      listingData.value.year = { ...singleYearOption }

      areYearsLoaded.value = false
    }
    else {
      listingData.value.year = undefined
      yearOptions.value = []
      areYearsLoaded.value = false
    }

    await nextTick()
  }

  if (listing.model) {
    const modelOption: VariantOption = {
      id: listing.model.id,
      value: listing.model.id,
      name: listing.model.name,
      disabled: false,
      details: listing.car
        ? {
            ...listing.car,
            geartype: listing.car.common_short_gearbox,
            driven_type: listing.car.drive_type,
            short_scale_type: listing.car.scale,
            displacement: listing.car.displacement,
            horse_power: listing.car.horse_power,
          }
        : {},
    }

    allVariants.value = [modelOption]
    listingData.value.model = { ...modelOption }

    variantsLoaded.value = true
    isAllVariantsLoaded.value = false
  }
  isModelSelected.value = true
}

const loadSeriesForBrand = async (brandId: number, isInitialLoad = false) => {
  if (brandAbort) {
    brandAbort.abort()
  }
  brandAbort = new AbortController()
  isLoadingSeries.value = true
  try {
    series.value = await getSeries(brandId, { signal: brandAbort.signal })
    allVariants.value = []
    variantsLoaded.value = false

    if (!isInitialLoad) {
      listingData.value.series = undefined
      listingData.value.model = undefined
      resetCarDetails()
      if (!listingId.value) {
        listingData.value.year = undefined
        listingData.value.month = ""
      }
    }

    if (listingData.value.series && !series.value.find(s => s.value === listingData.value.series?.value)) {
      listingData.value.series = undefined
      listingData.value.model = undefined
      resetCarDetails()
    }
  }
  catch (e: any) {
    if (e.name !== "AbortError") {
      console.error("Error loading series:", e)
      series.value = []
    }
  }
  finally {
    isLoadingSeries.value = false
  }
}

const loadAllVariants = async (seriesId: number, year: number) => {
  if (isVariantsLoading.value) {
    return
  }
  isVariantsLoading.value = true

  try {
    const currentModelId = listingData.value.model?.value

    const modelsList = await getModelsBySeriesAndYear(seriesId, year)

    const detailPromises = modelsList.map(m =>
      getCarDetails(Number(m.value)).catch(() => null),
    )
    const details = await Promise.all(detailPromises)

    const newVariants: VariantOption[] = modelsList.map((m, i) => ({
      ...m,
      details: details[i] || {},
    }))

    if (currentModelId && !newVariants.some(v => v.value === currentModelId)) {
      const fallback = allVariants.value.find(v => v.value === currentModelId)
      if (fallback) {
        newVariants.unshift(fallback)
      }
    }

    allVariants.value = newVariants

    variantsLoaded.value = true
    isModelSelected.value = true
    isAllVariantsLoaded.value = true
  }
  catch (e) {
    console.error("Error loading variants:", e)
  }
  finally {
    isVariantsLoading.value = false
  }
}

const resetCarDetails = () => {
  listingData.value.engineType = ""
  listingData.value.engine = ""
  listingData.value.power = undefined
  listingData.value.transmission = ""
  listingData.value.drive = ""
  listingData.value.bodyType = ""
}

watch(() => listingData.value.brand, async (brand, oldBrand) => {
  if (suppressWatch.value || !brand?.value || brand.value === oldBrand?.value) {
    return
  }

  await loadSeriesForBrand(brand.value as number, false)

  const firstSeries = series.value[0]
  if (firstSeries) {
    suppressWatch.value = true
    listingData.value.series = { ...firstSeries }
    await nextTick()
    suppressWatch.value = false
    await selectSeriesAndPopulate(Number(firstSeries.value))
  }
})

watch(() => listingData.value.series, async (seriesVal) => {
  if (suppressWatch.value) {
    return
  }
  if (seriesVal?.value) {
    suppressWatch.value = true
    await nextTick()
    suppressWatch.value = false
    await selectSeriesAndPopulate(Number(seriesVal.value))
  }
})

watch(() => listingData.value.model, async (modelVal) => {
  if (!modelVal?.value) {
    resetCarDetails()
  }
})

watch(() => listingData.value.year, async (newYear, oldYear) => {
  if (suppressWatch.value || !newYear?.value || !listingData.value.series?.value) {
    return
  }
  if (oldYear?.value === newYear.value) {
    return
  }

  await loadAllVariants(Number(listingData.value.series.value), Number(newYear.value))
  listingData.value.model = undefined
  resetCarDetails()
})

watch(filteredModelOptions, (newOptions) => {
  if (isVariantsLoading.value) {
    return
  }

  const selected = listingData.value.model?.value
  if (selected && !newOptions.some(o => o.value === selected)) {
    listingData.value.model = undefined
  }
})

const getComplectationYear = (): number | undefined => {
  const y = listingData.value.year
  if (!y) {
    return undefined
  }
  const val = typeof y === "object" && "value" in y ? (y as OptionBase).value : y
  const num = Number(val)
  return isNaN(num) ? undefined : num
}

watch(releaseYearMatchesComplectation, (checked) => {
  if (checked) {
    listingData.value.releaseYear = getComplectationYear()
  }
})

watch(() => listingData.value.year, () => {
  if (releaseYearMatchesComplectation.value) {
    listingData.value.releaseYear = getComplectationYear()
  }
})

async function selectSeriesAndPopulate(seriesId: number) {
  allVariants.value = []
  try {
    const years = await getYearsBySeries(seriesId)
    yearOptions.value = years.sort((a, b) => Number(b.value) - Number(a.value))
    suppressWatch.value = true
    listingData.value.year = yearOptions.value[0] ? { ...yearOptions.value[0] } : undefined
    listingData.value.model = undefined
    resetCarDetails()
    await nextTick()
    suppressWatch.value = false
    const firstYear = yearOptions.value[0]
    if (!firstYear) {
      return
    }
    await loadAllVariants(seriesId, Number(firstYear.value))
  }
  catch (error) {
    console.error("Error loading series data:", error)
  }
  finally {
    suppressWatch.value = false
  }
}

const onModelChange = (model: OptionBase) => {
  const variant = allVariants.value.find(v => v.value === model.value)
  if (variant && variant.details) {
    const d = variant.details
    const getVal = (val: string | null | undefined) =>
      (val && val !== "-" && val !== "0" && val !== "all") ? val : ""

    listingData.value.engineType = getVal(d.short_power_type)
    listingData.value.engine = getVal(d.displacement)
    listingData.value.transmission = getVal(d.geartype)
    listingData.value.drive = getVal(d.driven_type)
    listingData.value.bodyType = getVal(d.short_scale_type)
    listingData.value.power = (d.horse_power && d.horse_power !== "-" && d.horse_power !== "0" && d.horse_power !== "all")
      ? Number(d.horse_power)
      : undefined
  }
}

const fullscreenPhoto = ref<string | null>(null)
const fullscreenPhotoDescriptions = ref<Record<string, string> | null>(null)
const fullscreenVideo = ref<string | null>(null)

// Picks the caption for the current locale, falling back to any available variant.
const fullscreenCaption = computed(() => {
  const descriptions = fullscreenPhotoDescriptions.value
  if (!descriptions) {
    return ""
  }
  return descriptions[locale.value] ?? descriptions.ru ?? descriptions.zh ?? Object.values(descriptions)[0] ?? ""
})

function openFullscreenPhoto(img: string, descriptions?: Record<string, string> | null) {
  fullscreenPhoto.value = img
  fullscreenPhotoDescriptions.value = descriptions || null
}
function closeFullscreenPhoto() {
  fullscreenPhoto.value = null
  fullscreenPhotoDescriptions.value = null
}
function openFullscreenVideo(video: string) {
  fullscreenVideo.value = video
}
function closeFullscreenVideo() {
  fullscreenVideo.value = null
}

const ensureVariantsLoaded = async () => {
  if (isAllVariantsLoaded.value || isVariantsLoading.value) {
    return
  }
  if (!listingData.value.series?.value || !listingData.value.year?.value) {
    return
  }

  await loadAllVariants(
    Number(listingData.value.series.value),
    Number((listingData.value.year as any).value),
  )
}

const ensureYearsLoaded = async () => {
  if (areYearsLoaded.value || isYearsLoading.value) {
    return
  }
  if (!listingData.value.series?.value) {
    return
  }

  isYearsLoading.value = true
  try {
    const seriesId = Number(listingData.value.series.value)
    const years = await getYearsBySeries(seriesId)

    yearOptions.value = years.sort((a, b) => Number(b.value) - Number(a.value))

    if (listingData.value.year) {
      const currentVal = listingData.value.year.value
      const found = yearOptions.value.find(y => y.value === currentVal)
      if (found) {
        listingData.value.year = { ...found }
      }
    }

    areYearsLoaded.value = true
  }
  catch (e) {
    console.error("Error loading years:", e)
  }
  finally {
    isYearsLoading.value = false
  }
}

const removeRequest = (req: OptionBase) => {
  if (isRequestBindingLocked(req) || isFormDisabled.value) {
    return
  }
  selectedRequests.value = selectedRequests.value.filter(
    item => item.value !== req.value,
  )
}

const {
  isImporting,
  progress: importProgress,
  message: importMessage,
  errors: importErrors,
  startImport,
  cancelImport,
} = useListingImport({
  onSuccess: data => fillFormFromImport(data),
  onError: (msg) => {
    alert.value = {
      type: AlertTypeEnum.Error,
      subtitle: t("common.error"),
      text: msg,
    }
  },
})

const importError = computed(() => {
  if (importErrors.value.has("url")) {
    return importErrors.value.get("url")
  }
  if (importErrors.value.has("auth")) {
    return importErrors.value.get("auth")
  }
  if (importErrors.value.has("general")) {
    return importErrors.value.get("general")
  }

  return importErrors.value.all()
})
const importUrl = ref(isCreate.value && typeof route.query.import_url === "string" ? route.query.import_url : "")

const handleImport = async (withPhotos: boolean) => {
  if (!importUrl.value.trim()) {
    alert.value = {
      type: AlertTypeEnum.Error,
      subtitle: t("common.error"),
      text: t("listing.import_url_required"),
    }
    return
  }

  const success = await startImport(importUrl.value, withPhotos)

  if (success) {
    importUrl.value = ""
  }
}

const handleCancelImport = async () => {
  await cancelImport()

  alert.value = {
    type: AlertTypeEnum.Warning,
    subtitle: t("common.cancelled"),
    text: t("listing.import_cancelled"),
  }
}

const fillFormFromImport = async (data: ImportedListingData & { is_image_update?: boolean }) => {
  if (data.is_image_update) {
    await handleMediaUpdate(data)

    alert.value = {
      type: AlertTypeEnum.Success,
      subtitle: t("common.success"),
      text: t("listing.import_success"),
    }
    return
  }

  suppressWatch.value = true

  try {
    await waitForFormReady()
    await resetForm()

    const brandSet = await setBrand(data.brand_id)
    if (!brandSet) {
      showPartialImportAlert()
      await setMedia(data)
      return
    }

    const seriesSet = await setSeries(data.series_id)
    if (!seriesSet) {
      showPartialImportAlert()
      await setMedia(data)
      return
    }

    const yearSet = await setYear(data.year)

    if (yearSet && data.model_id) {
      await setModel(data.model_id)
    }

    await setOtherFields(data)
    await setMedia(data)
    showImportAlert(data)
  }
  catch (err) {
    console.error("Import form fill error:", err)
    alert.value = {
      type: AlertTypeEnum.Error,
      subtitle: t("common.error"),
      text: t("listing.import_fill_error"),
    }
  }
  finally {
    setTimeout(() => {
      suppressWatch.value = false
    }, 500)
  }
}

const handleMediaUpdate = async (data: ImportedListingData & { is_image_update?: boolean }) => {
  if (data.photo_ids?.length) {
    listingData.value.photo_ids = [
      ...(listingData.value.photo_ids || []),
      ...data.photo_ids,
    ]
    await fetchMediaPreviews(data.photo_ids, "photo")
  }

  if (data.video_ids?.length) {
    listingData.value.video_ids = [
      ...(listingData.value.video_ids || []),
      ...data.video_ids,
    ]
    await fetchMediaPreviews(data.video_ids, "video")
  }

  if (data.nameplate_ids?.length) {
    listingData.value.nameplate_ids = [...data.nameplate_ids]
    await fetchMediaPreviews(data.nameplate_ids, "nameplate")
  }

  alert.value = {
    type: AlertTypeEnum.Success,
    subtitle: t("common.success"),
    text: t("listing.import_success"),
  }
}

const showPartialImportAlert = () => {
  alert.value = {
    type: AlertTypeEnum.Warning,
    subtitle: t("common.warning"),
    text: t("listing.import_partial_warning"),
  }
}

const showImportAlert = (data: ImportedListingData) => {
  const isPartial = !data.brand_id || !data.series_id
  if (data.media_loading && !isPartial) {
    return
  }
  alert.value = {
    type: isPartial ? AlertTypeEnum.Warning : AlertTypeEnum.Success,
    subtitle: t(isPartial ? "common.warning" : "common.success"),
    text: t(isPartial ? "listing.import_partial_warning" : "listing.import_success"),
  }
}

/**
 * Страница при открытии сама подставляет автомобиль по умолчанию (первая марка,
 * её первая серия, свежий год). Импорт с dongchedi укладывается в пару секунд и
 * успевает заполнить форму раньше — тогда инициализация перетирает импортированные
 * марку, модель и год. Поэтому заполнение из импорта ждёт конца инициализации.
 */
const waitForFormReady = (timeoutMs = 20000): Promise<void> => {
  if (!isFormInitializing.value) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    let stop: (() => void) | null = null

    const done = () => {
      if (stop) {
        stop()
      }
      clearTimeout(timer)
      resolve()
    }

    const timer = setTimeout(done, timeoutMs)

    stop = watch(isFormInitializing, (initializing) => {
      if (!initializing) {
        done()
      }
    })
  })
}

const resetForm = async () => {
  listingData.value.brand = undefined
  listingData.value.series = undefined
  listingData.value.model = undefined
  listingData.value.year = undefined
  listingData.value.mileage = undefined
  listingData.value.bodyColor = ""
  listingData.value.original_paint = false
  listingData.value.city = undefined
  listingData.value.options = ""
  setListingSourceTexts(null)

  await nextTick()
}

const setBrand = async (brandId?: number): Promise<boolean> => {
  if (!brandId) {
    return false
  }

  const brand = sortedBrands.value.find(b => b.value === brandId)
  if (!brand) {
    console.warn("Brand not found in options:", brandId)
    return false
  }

  listingData.value.brand = { ...brand }

  await loadSeriesForBrand(brandId, true)
  await nextTick()

  return true
}

const setSeries = async (seriesId?: number): Promise<boolean> => {
  if (!seriesId) {
    return false
  }

  let foundSeries = series.value.find(s => s.value === seriesId)

  if (!foundSeries && listingData.value.brand?.value) {
    await loadSeriesForBrand(Number(listingData.value.brand.value), true)
    foundSeries = series.value.find(s => s.value === seriesId)
  }

  if (!foundSeries) {
    console.warn("Series not found in loaded list:", seriesId)
    return false
  }

  listingData.value.series = { ...foundSeries }

  const years = await getYearsBySeries(seriesId)
  yearOptions.value = years

  return true
}

const setYear = async (year?: number): Promise<boolean> => {
  if (!year) {
    return false
  }

  const yearOption = {
    id: year,
    value: year,
    name: String(year),
    disabled: false,
  }

  listingData.value.year = yearOption

  if (listingData.value.series) {
    await loadAllVariants(Number(listingData.value.series.value), year)
  }

  return true
}

const setModel = async (modelId: number): Promise<void> => {
  const matchedModel = allVariants.value.find(v => v.value === modelId)

  if (!matchedModel) {
    console.warn("Model not found in variants:", modelId)
    return
  }

  listingData.value.model = { ...matchedModel }

  onModelChange(matchedModel)
}

const setOtherFields = async (data: ImportedListingData): Promise<void> => {
  if (data.price && !listingData.value.price) {
    listingData.value.price = data.price
  }

  if (data.external_url && !listingData.value.externalUrl) {
    listingData.value.externalUrl = data.external_url
  }

  if (data.release_year && !listingData.value.releaseYear) {
    listingData.value.releaseYear = data.release_year
  }

  if (data.month) {
    listingData.value.month = String(data.month)
  }

  if (data.mileage) {
    listingData.value.mileage = data.mileage
  }

  if (data.color) {
    const colorCode = COLOR_MAP[data.color] || data.color
    const colorOption = bodyColorOptions.value.find(c => c.value === colorCode)

    if (colorOption) {
      listingData.value.bodyColor = { ...colorOption }
    }
    else {
      console.warn("Color not found in options:", data.color)
    }
  }

  if (data.city) {
    const cityOption = chinaCityOptions.value.find(c => c.value === data.city)

    if (cityOption) {
      listingData.value.city = { ...cityOption }
    }
    else {
      console.warn("City not found in options:", data.city)
    }
  }
}

const setMedia = async (data: ImportedListingData): Promise<void> => {
  if (data.photo_ids?.length) {
    listingData.value.photo_ids = [...data.photo_ids]
    await fetchMediaPreviews(data.photo_ids, "photo")
  }

  if (data.video_ids?.length) {
    listingData.value.video_ids = [...data.video_ids]
    await fetchMediaPreviews(data.video_ids, "video")
  }
}

const COLOR_MAP: Record<string, string> = {
  白色: "white",
  黑色: "black",
  灰色: "gray",
  银色: "silver",
  银灰色: "silver",
  蓝色: "blue",
  红色: "red",
  绿色: "green",
  棕色: "brown",
  咖啡色: "brown",
  黄色: "yellow",
  金色: "yellow",
  米色: "beige",
  香槟色: "beige",
}

const handleSubmit = async () => {
  if (isFormDisabled.value) {
    return
  }
  if (isPhotoUploading.value || isVideoUploading.value || isNameplateUploading.value || isDefectUploading.value) {
    console.warn("⚠️ [SUBMIT] Upload in progress, aborting")
    return
  }

  alert.value = null
  errors.value.clear()

  const vin = String(listingData.value.vin || "").trim()
  if (!isValidVin(vin)) {
    errors.value.record({ vin: t("listing.vin_invalid_length") })
    return
  }

  if (!listingData.value.releaseYear) {
    errors.value.record({ releaseYear: t("listing.release_year_required") })
    return
  }

  if (!listingData.value.photoFiles?.length) {
    errors.value.record({ photoFiles: t("listing.photo_required") })
    return
  }

  if (vin && !listingData.value.nameplateFiles?.length) {
    errors.value.record({ nameplateFiles: t("listing.nameplate_required") })
    return
  }

  if (listingData.value.manualInternalNumber && !listingData.value.internalNumber?.trim()) {
    errors.value.record({ internalNumber: t("listing.internal_number_required") })
    return
  }

  let currentListingId = listingId.value
  let savedListingData: any

  if (currentListingId && isRepublishMode.value) {
    savedListingData = await republish(currentListingId, listingData.value as ListingUpdate)

    if (!savedListingData) {
      console.error("❌ [SUBMIT] Republish failed, no data returned")
      return
    }

    listingSaleStatus.value = null
    successNotify("listing.republish_success")
    await router.push({ name: "personal-listings" })
    return
  }

  if (currentListingId) {
    savedListingData = await update(currentListingId, listingData.value as ListingUpdate)

    if (!savedListingData) {
      console.error("❌ [SUBMIT] Update failed, no data returned")
      return
    }
    if (savedListingData.diagnostic_changed_at !== undefined) {
      (listingData.value as any).diagnostic_changed_at = savedListingData.diagnostic_changed_at
    }
  }
  else {
    if (carLinkId.value) {
      listingData.value.carLinkId = carLinkId.value
    }

    savedListingData = await store(listingData.value as ListingStore)
    if (!savedListingData?.id) {
      console.error("❌ [SUBMIT] Store failed, no ID returned")
      return
    }
    currentListingId = savedListingData.id
    if (savedListingData.diagnostic_changed_at !== undefined) {
      (listingData.value as any).diagnostic_changed_at = savedListingData.diagnostic_changed_at
    }
    listingId.value = currentListingId
  }

  applyRequestTotals(savedListingData)
  setListingSourceTexts(savedListingData)

  if (savedListingData && "user_id" in savedListingData) {
    listingData.value.userId = savedListingData.user_id ?? 0
  }

  if (savedListingData.photos) {
    listingData.value.photoFiles = savedListingData.photos
  }
  if (savedListingData.nameplates) {
    listingData.value.nameplateFiles = savedListingData.nameplates
  }
  if (savedListingData.defects) {
    listingData.value.defectFiles = savedListingData.defects
  }
  if (savedListingData.videos) {
    listingData.value.videoFiles = savedListingData.videos
  }

  listingData.value.photo_ids = []
  listingData.value.video_ids = []
  listingData.value.nameplate_ids = []
  listingData.value.defect_ids = []

  pendingDeletePhotoIds.value = []
  pendingDeleteVideoIds.value = []
  pendingDeleteNameplateIds.value = []
  pendingDeleteDefectIds.value = []

  await router.push({
    name: "personal-listings-id",
    params: { id: currentListingId },
  })
}

definePageMeta({
  auth: true,
  roles: [RoleAdmin, RoleLogistic, RoleSellerSearch, RoleSellerContent, RoleSellerClient],
  layout: "catalog",
  hideTitle: true,
})
</script>

<style module>
.mainBlock {
  @apply grid items-start gap-4 w-full mb-6 xl:grid-cols-2;
}

.leftColumn {
  @apply flex flex-col gap-4 w-full min-w-0;
}

.rightColumn {
  @apply flex flex-col gap-4 w-full min-w-0;
}

.alert {
  @apply mb-4;
}

.panel {
  @apply rounded-[9px] border border-gray-200 bg-white shadow-sm;
}

.panelHeader {
  @apply flex items-start gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3;
}

.panelStep {
  @apply mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-blue-50 text-[11px] font-bold text-blue-600;
}

.panelHeaderText {
  @apply min-w-0;
}

.panelTitle {
  @apply text-sm font-bold tracking-tight text-gray-900;
}

.panelDesc {
  @apply mt-0.5 text-xs text-gray-500;
}

.panelBody {
  @apply p-4;
}

.optionsBlock {
  @apply flex flex-wrap items-center justify-between gap-3 rounded-[9px] border border-gray-200 bg-gray-50 px-3.5 py-3 mb-4;
}

.optionsLeft {
  @apply flex items-center;
}

.optionsLabel {
  @apply text-sm font-semibold text-gray-900 ml-3;
}

.statusBadge {
  @apply rounded-full px-2.5 py-1 text-[11px] font-semibold;
}

.statusBadgeOn {
  @apply bg-blue-50 text-blue-600;
}

.statusBadgeOff {
  @apply bg-gray-100 text-gray-500;
}

.activitySwitch {
  @apply relative inline-flex h-6 w-11 items-center rounded-full bg-white border border-gray-400 transition-colors;
}

.activitySwitch[aria-checked="true"] {
  @apply bg-blue-600 border-blue-600;
}

.activitySwitch::after {
  @apply absolute h-4 w-4 rounded-full bg-gray-400 transition-transform;
  content: "";
  transform: translateX(2px);
}

.activitySwitch[aria-checked="true"]::after {
  @apply bg-white translate-x-6;
}

.fieldsGrid {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-x-4 items-start;
}

.fieldsSubgrid {
  display: contents;
}

.fieldsFull {
  @apply min-w-0 w-full sm:col-span-2;
}

.info {
  @apply w-full;
}

.infoBox {
  @apply mb-4 min-w-0 w-full sm:col-span-2;
}

.vinRow {
  @apply flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 w-full sm:col-span-2;

  & > div {
    @apply w-full;
  }
}

.vinInput {
  @apply w-full sm:flex-1 min-w-0;
}

.vinCheckBtn {
  @apply shrink-0 p-2 sm:mt-7;
}

.infoSubBox {
  @apply mb-4 min-w-0 w-full;
}

.infoSubBox > :deep(*) {
  @apply w-full;
}

.infoRow {
  display: contents;
}

.radioSeparator {
  @apply px-4 text-gray-700;
}

.internalNumberLabel {
  @apply block text-sm font-medium text-gray-700 mb-2 w-full;
}

.autoNumberField {
  @apply flex items-center gap-2 w-full px-3 py-2 rounded-[9px] border border-dashed border-gray-300 bg-gray-50;
}

.autoNumberIcon {
  @apply h-4 w-4 text-gray-400 shrink-0;
}

.autoNumberValue {
  @apply text-sm font-medium text-gray-700 tracking-wide;
}

.autoNumberSeq {
  @apply text-gray-400;
}

.autoNumberBadge {
  @apply ml-auto text-[10px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-200 rounded-full px-2 py-0.5;
}

.internalNumberHint {
  @apply mt-1.5 text-xs text-gray-500;
}

.sectionBlock {
  @apply rounded-[9px] border border-gray-200 bg-white shadow-sm p-4;
}

.sectionHeader {
  @apply flex items-center mb-3 pb-3 border-b border-gray-100;
}

.sectionTitle {
  @apply text-sm font-bold tracking-tight text-gray-900;
}

.stickyBar {
  @apply sticky bottom-4 z-20 mt-2 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[9px] border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur;
}

.stickyHint {
  @apply text-xs text-gray-500;
}

.stickySaveBtn {
  @apply h-10 px-5;
}

.photoGrid {
  @apply grid grid-cols-2 sm:grid-cols-3 gap-4;
}

.photoItem {
  @apply relative w-full h-32;
}

.photoImage {
  @apply w-full h-32 object-cover rounded-[9px] border border-gray-200 cursor-zoom-in;
}

.photoRemoveBtn {
  @apply absolute top-1.5 right-1.5 z-10 flex items-center justify-center !p-0 !min-w-0 !h-7 !w-7 rounded-full shadow-sm bg-white/95 hover:bg-white hover:border-red-300 hover:text-red-600;
}

.fullscreenPhoto {
  @apply fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-4 bg-black bg-opacity-90;
}

.closeFullscreenBtn {
  @apply absolute top-6 right-6 z-10 bg-black bg-opacity-60 rounded-full p-2 hover:bg-opacity-90 transition;
}

.fullscreenImage {
  @apply max-w-full max-h-[85vh] rounded-xl shadow-2xl bg-[#111] object-contain;
}

.fullscreenCaption {
  @apply max-w-2xl text-center text-white text-sm sm:text-base bg-black bg-opacity-60 rounded-lg px-4 py-2;
}

.videoHeader {
  @apply flex items-center gap-4 mb-2;
}

.viewRequestsLink {
  @apply text-blue text-sm font-medium;
}

.videoGrid {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-4;
}

.videoItem {
  @apply relative w-full h-32 cursor-pointer;
}

.videoElement {
  @apply w-full h-32 object-cover rounded-[9px] border border-gray-200 bg-black pointer-events-none;
}

.playIcon {
  @apply absolute left-1/2 top-1/2 z-10 pointer-events-none;
}

.fullscreenVideo {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90;
}

.fullscreenVideoElement {
  @apply max-w-full max-h-full rounded-xl shadow-2xl bg-[#111] object-contain;
}

.diagnosticHeader {
  @apply flex items-center gap-4 mb-2;
}

.reportLinkBlock {
  @apply mt-4 p-4 rounded-[9px] border border-gray-200 bg-gray-50;
}

.reportLinkLabel {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.reportLinkRow {
  @apply flex items-center gap-3;
}

.reportLinkValue {
  @apply text-sm text-blue-600 hover:underline break-all flex-1;
}

.diagnosticImportBtn {
  @apply mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-[9px] text-sm font-medium
    bg-blue-600 text-white hover:bg-blue-700 transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed;
}

.tooltipIcon {
  @apply w-5 h-5 text-gray-400;
}

.tooltipIconVin {
  @apply w-5 h-5 text-gray-400;
}

.selectedRequestsList {
  @apply flex flex-wrap gap-2 mb-4 sm:col-span-2;
}

.selectedRequestItem {
  @apply flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm;
}

.removeRequestBtn {
  @apply text-gray-500 hover:text-red-500 transition-colors;
}

.resetFilterBtn {
  @apply absolute top-9 right-7 p-1 text-gray-400 hover:text-red-500 transition z-[8];
}

.resetFilterCompBtn {
  @apply absolute top-[0.38rem] right-8 p-1 text-gray-400 hover:text-red-500 transition z-[8];
}

.importBlock {
  @apply rounded-[9px] border border-blue-200 bg-blue-50/60 p-3.5;
}

.importHint {
  @apply text-xs text-gray-500;
}

.carLinkNotice {
  @apply text-sm text-gray-700 mb-2.5;
}

.progressBar {
  @apply relative mt-3 h-8 bg-gray-200 rounded overflow-hidden;
}

.progressFill {
  @apply h-full bg-blue-600 transition-all duration-300;
}

.progressText {
  @apply absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-700;
}

.releaseYearCheckbox {
  @apply mb-1 -mt-2 sm:col-span-2;
}

.requestWarning {
  @apply flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-[9px] px-3 py-2 mb-4 sm:col-span-2;
}

.inputFileWrapper {
  @apply relative;
}

.dragHandle {
  @apply absolute top-2 left-2 p-1 text-white bg-black bg-opacity-50 rounded cursor-move opacity-0 hover:opacity-100 transition-opacity;
}

.photoItem:hover .dragHandle {
  @apply opacity-100;
}

.photoItem[draggable="true"] {
  @apply cursor-move;
}

.photoItem[draggable="true"]:active {
  @apply opacity-50;
}

.photoItemDropTarget {
  @apply outline outline-2 outline-offset-2 outline-blue-500 rounded-[9px];
}

.compensationSubheader {
  @apply text-sm mb-5 text-[#757575];
}

.showReportLink {
  @apply text-blue text-sm flex items-center leading-tight;
}
</style>
