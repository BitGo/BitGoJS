# Claude reviews

Repository owners and members can request a pull request review by commenting
`@claude`. The workflow uses `prompts/code-review.md` and posts the review as a
pull request comment. Add instructions after `@claude` to use interactive mode
with the triggering comment and conversation context instead.

Reviews use Claude Sonnet 5.5 through the global cross-region Bedrock inference
profile from `us-west-2`. Configure the model with `ANTHROPIC_MODEL`; the workflow
disables extended thinking because Bedrock rejects replayed tool-call turns
without a leading thinking block. The workflow has a ten-minute job timeout.
The inference role must permit invocation of the profile and its destination
models.

Comment-triggered workflows use the default branch's workflow definition.
End-to-end verification of workflow changes requires merging them before
requesting another review.
