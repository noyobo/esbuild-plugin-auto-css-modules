async function getStyles() {
  const styles = await import('./styles.css?abc');
  const styles2 = await import('./styles.css');
  return { styles, styles2 };
}

console.log(getStyles());
