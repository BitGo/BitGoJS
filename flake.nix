{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    nixpkgs-nodejs.url = "github:nixos/nixpkgs/6ad174a6dc07c7742fc64005265addf87ad08615"; # Node.js 22.14.0
    pre-commit-hooks = {
      url = "github:cachix/pre-commit-hooks.nix";
      # Avoids pulling in a second version of `nixpkgs`
      inputs = {
        nixpkgs.follows = "nixpkgs";
      };
    };
  };

  outputs = {
    self,
    nixpkgs,
    nixpkgs-nodejs,
    pre-commit-hooks,
  }: let
    forEachSystem = nixpkgs.lib.genAttrs [
      "aarch64-darwin"
      "aarch64-linux"
      "x86_64-darwin"
      "x86_64-linux"
    ];
  in {
    checks = forEachSystem (system: {
      pre-commit-check = pre-commit-hooks.lib.${system}.run {
        src = ./.;
        hooks = {
          commitlint = {
            enable = true;
            name = "commitlint";
            entry = "npx --no -- commitlint --edit";
            language = "system";
            stages = ["commit-msg"];
          };
        };
      };
    });

    devShells = forEachSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
      pre-commit-check = self.checks.${system}.pre-commit-check;
    in {
      default = pkgs.mkShell {
        packages = with nixpkgs-nodejs.legacyPackages.${system}; [
          nodejs_22
          (yarn.override { nodejs = nodejs_22; })
        ];

        shellHook = ''
          export PATH="$(pwd)/node_modules/.bin:$PATH"
          ${pre-commit-check.shellHook}
          pre-commit install --hook-type commit-msg
        '';
      };
    });
  };
}
