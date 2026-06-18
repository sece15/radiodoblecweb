def main():
    path = r"c:\Users\Sece\Desktop\Radio-Doble-C-Web\src\context\AudioContext.tsx"
    with open(path, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f, 1):
            if "currenttrack" in line.lower() and "=" in line:
                print(f"L{idx}: {line.strip()}")

if __name__ == "__main__":
    main()
