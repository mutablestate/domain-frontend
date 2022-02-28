<script>
  import { onMount } from "svelte";
  import { ethers } from "ethers";

  import twitterLogo from "./assets/img/twitter-logo.svg";
  import polygonLogo from "./assets/img/polygonlogo.png";
  import ethLogo from "./assets/img/ethlogo.png";

  import contractAbi from "./utils/contractAbi.json";
  import { shortenAddress } from "./utils/shortenAddress";
  import { networks } from "./utils/networks";

  import DomainForm from "./lib/DomainForm.svelte";
  import MintList from "./lib/MintList.svelte";

  import {
    currentAccount,
    currentNetwork,
    connectedContract,
    domain,
    record,
    mints,
    CONTRACT_ADDRESS,
  } from "./store";

  const TWITTER_HANDLE = "_buildspace";
  const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

  let ethereum;

  let receipt;
  let txn;
  let isMinting;

  $: if ($currentNetwork === "Polygon Mumbai Testnet") {
    fetchMints();
  }

  async function setCurrentAccount() {
    const accounts = await ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      currentAccount.set(account);
    } else {
      console.log("No authorized account found");
    }
  }

  function reloadOnChainChange() {
    window.location.reload();
  }

  async function setCurrentNetwork() {
    const chainId = await ethereum.request({ method: "eth_chainId" });
    currentNetwork.set(networks[chainId]);
    ethereum.on("chainChanged", reloadOnChainChange);
  }

  async function setConnectedContract() {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      $CONTRACT_ADDRESS,
      contractAbi.abi,
      signer
    );
    connectedContract.set(contract);
  }

  async function handleWalletConnect() {
    if (!ethereum) return;
    const accounts = await ethereum.request({
      method: "eth_requestAccounts",
    });
    console.log("Connected", accounts[0]);
    currentAccount.set(accounts[0]);
  }

  async function handleSwitchNetwork() {
    if (!ethereum) return;
    try {
      // Try to switch to the Mumbai testnet
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x13881" }], // Check networks.js for hexadecimal network ids
      });
    } catch (error) {
      // This error code means that the chain we want has not been added to MetaMask
      // In this case we ask the user to add it to their MetaMask
      if (error.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x13881",
                chainName: "Polygon Mumbai Testnet",
                rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
                nativeCurrency: {
                  name: "Mumbai Matic",
                  symbol: "MATIC",
                  decimals: 18,
                },
                blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
              },
            ],
          });
        } catch (error) {
          console.log(error);
        }
      }
      console.log(error);
    }
  }

  function isValidDomain() {
    if (!$domain) {
      alert("Please enter a domain between 3 and 10 characters!");
      return false;
    }
    if ($domain.length < 3) {
      alert("Domain must be more than 3 characters!");
      return false;
    }
    if ($domain.length > 10) {
      alert("Domain must be less than 10 characters!");
      return false;
    }
    return true;
  }

  function calculatePrice() {
    const domainLength = $domain.length;
    if (domainLength === 3) return "0.5";
    if (domainLength === 4) return "0.3";
    return "0.1";
  }

  async function setDomainRecord() {
    if (receipt.status === 1) {
      console.log(
        "Domain minted! https://mumbai.polygonscan.com/tx/" + txn.hash
      );
      txn = await $connectedContract.setRecord($domain, $record);
      await txn.wait();

      console.log("Record set! https://mumbai.polygonscan.com/tx/" + txn.hash);

      setTimeout(() => {
        fetchMints();
      }, 2000);

      record.set("");
      domain.set("");
    } else {
      alert("Transaction failed! Please try again");
    }
  }

  async function handleMintDomain() {
    const isValid = isValidDomain();
    if (isValid) {
      console.log("Valid domain!");
      const price = calculatePrice();
      isMinting = true;

      try {
        txn = await $connectedContract.register($domain, {
          value: ethers.utils.parseEther(price),
        });
        console.log("Minting domain", $domain, "with price", price);
        receipt = await txn.wait();
        console.log("Mined tx", receipt);
        setDomainRecord();
      } catch {
        console.log("Gas rejected...");
      }
      isMinting = false;
    } else {
      console.log("Mint failed!");
    }
  }

  async function fetchMints() {
    if (!$currentAccount || !$connectedContract) return;
    console.log("fetchMints");
    try {
      // Get all the domain names from our contract
      const names = await $connectedContract.getAllNames();
      console.log("names", names);

      // For each name, get the record and the address
      const mintRecords = await Promise.all(
        names.map(async (name) => {
          const mintRecord = await $connectedContract.records(name);
          const owner = await $connectedContract.domains(name);
          return {
            id: names.indexOf(name),
            name: name,
            record: mintRecord,
            owner: owner,
          };
        })
      );
      mints.set(mintRecords);
    } catch (error) {
      console.log(error);
    }
  }

  onMount(async () => {
    ethereum = window?.ethereum;
    if (ethereum) {
      await setCurrentAccount();
      await setConnectedContract();
      await setCurrentNetwork();
      await fetchMints();
    }
  });
</script>

<main>
  <div class="container">
    <header class="header-container">
      <div>
        <p class="title">🎩 OG Name Service 🕘</p>
        <p class="subtitle">The blockchain Originals️️</p>
        {#if $currentAccount && $currentNetwork}
          <div class="network">
            <img
              alt="Network logo"
              class="logo"
              src={$currentNetwork.includes("Polygon") ? polygonLogo : ethLogo}
            />
            Wallet: {shortenAddress($currentAccount)}
            <img
              alt="Network logo"
              class="logo-right"
              src={$currentNetwork.includes("Polygon") ? polygonLogo : ethLogo}
            />
          </div>
        {/if}
      </div>
    </header>

    {#if $currentAccount}
      {#if $currentNetwork === "Polygon Mumbai Testnet"}
        <DomainForm
          onMintDomain={handleMintDomain}
          onFetchMints={fetchMints}
          {isMinting}
        />
        {#if $mints.length > 0}
          <MintList />
        {/if}
      {:else}
        <div class="connect-wallet-container">
          <div class="connect-wallet-container">
            <h2>Please switch to Polygon Mumbai Testnet</h2>
            <button
              class="cta-button mint-button"
              on:click={handleSwitchNetwork}
            >
              Click here to switch
            </button>
          </div>
        </div>
      {/if}
    {:else}
      <div class="connect-wallet-container">
        <img
          src="https://media.giphy.com/media/tVUZ62FQBqRVu/giphy.gif"
          alt="OG Yoda"
        />
        <button
          class="cta-button connect-wallet-button"
          on:click={handleWalletConnect}
        >
          Connect Wallet
        </button>
      </div>
    {/if}

    <div class="footer-container">
      <img alt="Twitter Logo" class="twitter-logo" src={twitterLogo} />
      <a
        class="footer-text"
        href={TWITTER_LINK}
        target="_blank"
        rel="noreferrer"
        >built with @${TWITTER_HANDLE}
      </a>
    </div>
  </div>
</main>
