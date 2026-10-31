package modelark.egress

default allow := false

allow if {
  input.policy.mode == "explicit_allowlist"
  input.destination in input.policy.allowed_destinations
}
