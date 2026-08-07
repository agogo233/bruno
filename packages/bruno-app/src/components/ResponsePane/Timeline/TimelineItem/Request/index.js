import { useTranslation } from 'react-i18next';
import Headers from '../Common/Headers/index';
import BodyBlock from '../Common/Body/index';

const safeStringifyJSONIfNotString = (obj, t) => {
  if (obj === null || obj === undefined) return '';
  if (typeof obj === 'string') return obj;
  try {
    return JSON.stringify(obj);
  } catch (e) {
    return t('RESPONSE_PANE.TIMELINE.UNSERIALIZABLE');
  }
};

const Request = ({ collection, request, item }) => {
  const { t } = useTranslation();
  let { headers, data, dataBuffer, error } = request || {};
  if (!dataBuffer) {
    dataBuffer = Buffer.from(safeStringifyJSONIfNotString(data, t))?.toString('base64');
  }

  return (
    <>
      <Headers headers={headers} />
      <BodyBlock
        collection={collection}
        data={data}
        dataBuffer={dataBuffer}
        error={error}
        headers={headers}
        item={item}
        type="request"
      />
    </>
  );
};

export default Request;
