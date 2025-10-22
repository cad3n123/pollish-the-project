const [$privacyPolicyButton, $privacyPolicyDiv, $privacyPolicyX] = [
  'privacy-policy',
  'privacy-policy-div',
  'privacy-policy-x',
].map((id) => document.getElementById(id));

$privacyPolicyButton.addEventListener('click', () => {
  $privacyPolicyDiv.classList.add('active');
});
$privacyPolicyX.addEventListener('click', () => {
  $privacyPolicyDiv.classList.remove('active');
});
