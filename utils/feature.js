function combineDateTime(dateStr, timeStr) {
  const dateObj = new Date(dateStr);
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Set hours and minutes from the time string
  // dateObj.setUTCHours(hours, minutes, 0, 0);
  dateObj.setHours(hours);
  dateObj.setMinutes(minutes);

  return dateObj;
}

export { combineDateTime };
