export function formatMessageTime(date) {
  const messageDate = new Date(date);
  const today = new Date();
  
  // Format options for date and time
  const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
  const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };

  // If the message is from today, return just the time, otherwise return both date and time
  const timeString = messageDate.toLocaleTimeString("en-US", timeOptions);
  const dateString = messageDate.toLocaleDateString("en-US", dateOptions);
  
  return `${dateString} ${timeString}`;
}
