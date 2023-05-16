<template>
    <!-- Pass down all attributes not declared as props -->
    <Modal v-bind="$attrs" v-on="$listeners" class="staking-modal"
        :class="{ 'large-modal': [Page.Graph, Page.Already].includes(page) }"
        :showOverlay="overlay === Overlay.SelectAccount || overlay === Overlay.Validator"
        @close-overlay="closeOverlay"
    >
        <template v-if="page === Page.Info">
            <StakingWelcomePage @next="switchValidator" />
        </template>
        <template v-if="page === Page.Graph">
            <StakingGraphPage
                @back="isStaking ? (page = Page.Already) : (page = Page.Info)"
                @next="page = Page.Already"
                @changeValidator="switchValidator"
            />
        </template>
        <template v-if="page === Page.Already">
            <StakingInfoPage
                @back="page = Page.Graph" @next="page = Page.RewardsHistory"
                @adjust-stake="adjustStake"
                @switch-validator="switchValidator"
            />
        </template>
        <template v-if="page === Page.RewardsHistory">
            <StakingRewardsHistoryPage @back="page = Page.Already" />
        </template>
        <template v-if="page === Page.Validator">
            <StakingValidatorPage
                @back="page = isStaking ? Page.Already : Page.Info"
                @next="page = Page.Graph; closeOverlay()"
                @success="onValidatorChangeSuccess"
                @error="onValidatorChangeError"
            />
        </template>
        <template slot="overlay">
            <div v-if="statusScreenOpened" class="page">
                <StatusScreen
                    :title="statusTitle"
                    :state="statusState"
                    :message="statusMessage"
                    :mainAction="statusMainActionText"
                    :alternativeAction="statusAlternativeActionText"
                    @main-action="onStatusMainAction"
                    @alternative-action="onStatusAlternativeAction"
                    :lightBlue="true"
                />
            </div>
            <SelectAccountOverlay v-else-if="overlay === Overlay.SelectAccount"
                @selected="switchValidator"
            />
            <StakingValidatorPage v-else-if="overlay === Overlay.Validator"
                @back="page = isStaking ? Page.Already : Page.Info"
                @next="page = Page.Graph; closeOverlay()"
                @success="onValidatorChangeSuccess"
                @error="onValidatorChangeError"
            />
        </template>
    </Modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from '@vue/composition-api';
import { useStakingStore } from '../../stores/Staking';
import { useAddressStore } from '../../stores/Address';
import Modal from '../modals/Modal.vue';
import StakingWelcomePage from './StakingWelcomePage.vue';
import StakingValidatorPage from './StakingValidatorPage.vue';
import StakingGraphPage from './StakingGraphPage.vue';
import StakingInfoPage from './StakingInfoPage.vue';
import StakingRewardsHistoryPage from './StakingRewardsHistoryPage.vue';
import SelectAccountOverlay from './SelectAccountOverlay.vue';
import StatusScreen, { State, SUCCESS_REDIRECT_DELAY } from '../StatusScreen.vue';

enum Page {
    Info,
    Graph,
    Already,
    RewardsHistory,
    Validator,
}

enum Overlay {
    SelectAccount,
    Validator,
}

export default defineComponent({
    setup(props, context) {
        const { activeAddressInfo } = useAddressStore();
        const { activeValidator, activeStake } = useStakingStore();
        const page = ref(activeValidator.value ? Page.Already : Page.Info);
        const overlay = ref<Overlay | null>(null);

        const invalidAccount = computed(() => activeAddressInfo.value
            ? !activeAddressInfo.value.balance && !activeStake.value?.balance
            : false);

        const adjustStake = () => { page.value = Page.Graph; };
        const switchValidator = () => { page.value = Page.Validator; };
        const closeOverlay = () => { overlay.value = null; };

        const isStaking = computed(() => !!(activeStake.value || activeValidator.value));

        watch(activeStake, (stake) => {
            if (!stake) page.value = Page.Info;
        }, { lazy: true });

        function showOverlayIfInvalidAccount(newPath: Overlay | Page) {
            if ((newPath === Overlay.Validator || newPath === Page.Validator) && invalidAccount.value) {
                overlay.value = Overlay.SelectAccount;
            }
        }

        watch(page, (newPage) => showOverlayIfInvalidAccount(newPage as Page));
        watch(overlay, (newOverlay) => showOverlayIfInvalidAccount(newOverlay as Overlay));

        /**
         * Status Screen
         */
        const statusScreenOpened = ref(false);
        const statusTitle = ref(context.root.$t('Sending Transaction')); // TODO: update text
        const statusState = ref(State.LOADING);
        const statusMessage = ref('');
        const statusMainActionText = ref(context.root.$t('Retry'));
        const statusAlternativeActionText = ref(context.root.$t('Edit transaction')); // TODO: update text

        return {
            Page,
            Overlay,

            page,
            overlay,
            activeValidator,
            adjustStake,
            switchValidator,
            closeOverlay,
            invalidAccount,
            isStaking,

            statusScreenOpened,
            statusTitle,
            statusState,
            statusMessage,
            statusMainActionText,
            statusAlternativeActionText,
        };
    },
    components: {
        Modal,
        StakingWelcomePage,
        StakingValidatorPage,
        StakingGraphPage,
        StakingInfoPage,
        StakingRewardsHistoryPage,
        SelectAccountOverlay,
        StatusScreen,
    },
});
</script>

<style lang="scss" scoped>
    .modal {
        &.large-modal {
            ::v-deep .small-page {
                transition: transform var(--transition-time) var(--nimiq-ease),
                            width 200ms var(--nimiq-ease);
                width: 63.5rem;
                // height: 74.875rem;
                // transition: width 1.5s ease-out;
            }
            // transition: width 0.75s ease-out;
        }
    }
</style>
