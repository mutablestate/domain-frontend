<script>
  import { connectedContract, domain, record, TLD, editing } from "../store";

  export let onMintDomain;
  export let isMinting;
  export let onFetchMints;

  $: domainValue = $domain;
  $: recordValue = $record;

  function handleDomainChange(event) {
    const { value } = event.target;
    console.log("domainChange", value);
    domainValue = value;
    domain.set(value);
  }

  function handleRecordChange(event) {
    const { value } = event.target;
    console.log("recordChange", value);
    recordValue = value;
    record.set(value);
  }

  async function handleUpdateDomain() {
    if (!recordValue || !domainValue) return;
    isMinting = true;
    console.log("Updating domain", domainValue, "with record", recordValue);
    try {
      let tx = await $connectedContract.setRecord(domainValue, recordValue);
      await tx.wait();
      console.log("Record set https://mumbai.polygonscan.com/tx/" + tx.hash);

      onFetchMints();
      record.set("");
      domain.set("");
      editing.set(false);
    } catch (error) {
      console.log(error);
    }
    isMinting = false;
  }

  function handleCancelEdit() {
    record.set("");
    domain.set("");
    editing.set(false);
  }
</script>

<div class="form-container">
  <div class="first-row">
    <input
      type="text"
      bind:value={domainValue}
      placeholder="Domain"
      on:change={handleDomainChange}
    />
    <p class="tld">
      {$TLD}
    </p>
  </div>

  <input
    type="text"
    bind:value={recordValue}
    placeholder="What's your OG power?"
    on:change={handleRecordChange}
  />

  {#if $editing}
    <div class="button-container">
      <button
        class="cta-button mint-button"
        disabled={isMinting}
        on:click={handleUpdateDomain}
      >
        {isMinting ? "Minting..." : "Update OG power"}
      </button>
      <button
        class="cta-button mint-button"
        disabled={isMinting}
        on:click={handleCancelEdit}
      >
        Cancel
      </button>
    </div>
  {:else}
    <div class="button-container">
      <button
        class="cta-button mint-button"
        disabled={isMinting}
        on:click={onMintDomain}
      >
        {isMinting ? "Minting..." : "Mint"}
      </button>
    </div>
  {/if}
</div>
