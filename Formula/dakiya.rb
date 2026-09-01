class Dakiya < Formula
  desc "Local-first API toolkit — CLI + web dashboard"
  homepage "https://github.com/Prashant4900/Dakiya"
  url "https://registry.npmjs.org/dakiya/-/dakiya-0.1.0.tgz"
  sha256 "PLACEHOLDER_SHA256"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "Usage:", shell_output("#{bin}/dakiya --help")
  end
end
