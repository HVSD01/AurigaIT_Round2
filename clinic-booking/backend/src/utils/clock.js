let virtualTime = null;

const getNow = () => {
  if (virtualTime !== null) {
    return new Date(virtualTime);
  }
  return new Date();
};

const getVirtualTime = () => virtualTime;

const setVirtualTime = (isoString) => {
  const previousTime = virtualTime !== null ? new Date(virtualTime) : null;
  virtualTime = new Date(isoString);
  return { previousTime, currentTime: new Date(virtualTime) };
};

const resetVirtualTime = () => {
  virtualTime = null;
};

module.exports = {
  getNow,
  getVirtualTime,
  setVirtualTime,
  resetVirtualTime,
};

