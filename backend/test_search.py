"""Standalone test for Azure AI Search integration."""

from dotenv import load_dotenv
load_dotenv()

from azure_search_client import search_fda_regulations


def main():
    print("=" * 60)
    print("TEST 1: encryption disabled on genomics storage account")
    print("=" * 60)
    passages_1, source_1 = search_fda_regulations(
        "encryption disabled on genomics storage account"
    )
    print(f"\nSource: {source_1}")
    print(f"Passages:\n{passages_1[:500]}...")
    print()

    print("=" * 60)
    print("TEST 2: firewall port 22 opened on production server")
    print("=" * 60)
    passages_2, source_2 = search_fda_regulations(
        "firewall port 22 opened on production server"
    )
    print(f"\nSource: {source_2}")
    print(f"Passages:\n{passages_2[:500]}...")
    print()

    print("=" * 60)
    if passages_1 and passages_2:
        print("PASS")
    else:
        print("FAIL")
    print("=" * 60)


if __name__ == "__main__":
    main()
