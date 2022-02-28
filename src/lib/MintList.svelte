<script>
  import {
    currentAccount,
    mints,
    TLD,
    CONTRACT_ADDRESS,
    editing,
    domain,
  } from "../store";

  function editRecord(name) {
    console.log("Editing record for", name);
    editing.set(true);
    domain.set(name);
  }
</script>

<div class="mint-container">
  <p class="subtitle">Recently minted domains!</p>
  <div class="mint-list">
    {#each $mints as mint}
      <div class="mint-item">
        <div class="mint-row">
          <a
            class="link"
            href={`https://testnets.opensea.io/assets/mumbai/${$CONTRACT_ADDRESS}/${mint.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <p class="underlined">
              {mint.name}{$TLD}
            </p>
          </a>
          {#if mint.owner.toLowerCase() === $currentAccount.toLowerCase()}
            <button class="edit-button" on:click={() => editRecord(mint.name)}>
              <img
                class="edit-icon"
                src="https://img.icons8.com/metro/26/000000/pencil.png"
                alt="Edit button"
              />
            </button>
          {/if}
        </div>
        <p>{mint.record}</p>
      </div>
    {/each}
  </div>
</div>
