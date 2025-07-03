export type GithubSource = {
  org: string;
  repo: string;
} & ({ tag: string } | { ref: string });

export type VendorConfig = GithubSource & {
  targetDir: string;
  postExtract?: (src: GithubSource, targetDir: string) => Promise<void>;
};
