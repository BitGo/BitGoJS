{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    nixpkgs-nodejs.url = "github:nixos/nixpkgs/de1864217bfa9b5845f465e771e0ecb48b30e02d"; # Node.js 20.18.1
    pre-commit-hooks = {
      url = "github:cachix/pre-commit-hooks.nix";
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
    checks = forEachSystem (system: let
      pre-commit-check = pre-commit-hooks.lib.${system}.run {
        src = ./.;
        hooks = {
          actionlint.enable = true;
          alejandra.enable = true;
          prettier.enable = true;
        };
      };
    in {
      inherit pre-commit-check;
    });

    devShells = forEachSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      default = pkgs.mkShell {
        packages = with nixpkgs-nodejs.legacyPackages.${system}; [
          nodejs_20
          (yarn.override { nodejs = nodejs_20; })
        ];

        shellHook = ''
          ${self.checks.${system}.pre-commit-check.shellHook}
          export PATH="$(pwd)/node_modules/.bin:$PATH"
        '';
      };
    });
  };
}
